import json
import logging
import os
import uuid
from decimal import Decimal
from json import dumps as json_dumps
from datetime import date
import azure.functions as func
from .database import get_database

logger = logging.getLogger(__name__)


def json_response(payload, status_code=200):
    return func.HttpResponse(
        json.dumps(payload, default=json_serializer),
        status_code=status_code,
        mimetype="application/json"
    )


def json_serializer(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, date):
        return value.isoformat()
    return str(value)


def parse_json(req: func.HttpRequest):
    try:
        return req.get_json()
    except ValueError:
        return None


def parse_decimal(value):
    if value is None or value == "":
        return None
    try:
        return Decimal(str(value))
    except Exception:
        return None


def parse_uuid(value):
    try:
        return uuid.UUID(str(value))
    except Exception:
        return None


def parse_date(value):
    if not value:
        return None
    try:
        return date.fromisoformat(str(value))
    except Exception:
        return None


def parse_bool(value, default=None):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in ("true", "1", "yes"):
            return True
        if lowered in ("false", "0", "no"):
            return False
    return default


def parse_initiative_ids(req: func.HttpRequest):
    raw = req.params.get("initiativeIds") or req.params.get("initiative_ids")
    if not raw:
        return []
    ids = []
    for entry in raw.split(","):
        entry = entry.strip()
        if not entry:
            continue
        parsed = parse_uuid(entry)
        if parsed:
            ids.append(parsed)
    return ids


def build_initiative_filter(ids, column="initiative_id"):
    if not ids:
        return "", []
    return f"WHERE {column} = ANY(%s)", [ids]


def require_connection():
    connection_string = os.getenv("POSTGRES_CONNECTION_STRING")
    if not connection_string:
        return None, json_response(
            {"error": "POSTGRES_CONNECTION_STRING is not set"},
            status_code=500
        )
    return get_database(connection_string), None


def get_actor(req: func.HttpRequest):
    return (
        req.headers.get("x-user-email")
        or req.headers.get("x-ms-client-principal-name")
        or req.headers.get("x-ms-client-principal-id")
    )


def log_audit(db, entity_type, entity_id, action, actor, payload):
    db.execute(
        """
        INSERT INTO audit_log (id, entity_type, entity_id, action, actor, payload)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            uuid.uuid4(),
            entity_type,
            entity_id,
            action,
            actor,
            json_dumps(payload) if payload else None
        )
    )


def health(req: func.HttpRequest) -> func.HttpResponse:
    return json_response({"status": "ok"})


def programs(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    if req.method == "GET":
        rows = db.fetch_all(
            """
            SELECT id::text, name, status, description
            FROM programs
            ORDER BY name
            """
        )
        return json_response(rows)

    payload = parse_json(req)
    if not payload or not payload.get("name"):
        return json_response({"error": "Program name is required"}, status_code=400)

    program_id = uuid.uuid4()
    db.execute(
        """
        INSERT INTO programs (id, name, status, description)
        VALUES (%s, %s, %s, %s)
        """,
        (
            program_id,
            payload.get("name").strip(),
            payload.get("status", "active"),
            payload.get("description")
        )
    )
    log_audit(db, "program", program_id, "create", get_actor(req), payload)
    return json_response({"id": str(program_id)})


def program_detail(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    program_id = parse_uuid(req.route_params.get("program_id"))
    if not program_id:
        return json_response({"error": "Invalid program id"}, status_code=400)

    if req.method == "DELETE":
        db.execute("DELETE FROM programs WHERE id = %s", (program_id,))
        log_audit(db, "program", program_id, "delete", get_actor(req), None)
        return json_response({"status": "deleted"})

    payload = parse_json(req)
    if not payload:
        return json_response({"error": "Body required"}, status_code=400)
    if not payload.get("name"):
        return json_response({"error": "Program name is required"}, status_code=400)

    db.execute(
        """
        UPDATE programs
        SET name = %s,
            status = %s,
            description = %s,
            updated_at = now()
        WHERE id = %s
        """,
        (
            payload.get("name"),
            payload.get("status", "active"),
            payload.get("description"),
            program_id
        )
    )
    log_audit(db, "program", program_id, "update", get_actor(req), payload)
    return json_response({"status": "updated"})


def initiatives(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    if req.method == "GET":
        rows = db.fetch_all(
            """
            SELECT i.id::text,
                   i.name,
                   i.status,
                   i.start_date,
                   i.end_date,
                   i.headcount,
                   i.irr,
                   i.revenue,
                   i.cost,
                   i.margin,
                   i.program_id::text AS "programId",
                   p.name AS "programName"
            FROM initiatives i
            LEFT JOIN programs p ON p.id = i.program_id
            ORDER BY i.name
            """
        )
        return json_response(rows)

    payload = parse_json(req)
    if not payload or not payload.get("name"):
        return json_response({"error": "Initiative name is required"}, status_code=400)

    start_date = parse_date(payload.get("startDate"))
    end_date = parse_date(payload.get("endDate"))
    if start_date and end_date and start_date > end_date:
        return json_response(
            {"error": "Start date must be before end date"},
            status_code=400
        )

    program_id = parse_uuid(payload.get("programId"))
    program_name = payload.get("program")

    if not program_id and program_name:
        existing = db.fetch_one(
            "SELECT id FROM programs WHERE name = %s",
            (program_name.strip(),)
        )
        if existing:
            program_id = existing["id"]
        else:
            program_id = uuid.uuid4()
            db.execute(
                """
                INSERT INTO programs (id, name, status)
                VALUES (%s, %s, 'active')
                """,
                (program_id, program_name.strip())
            )

    initiative_id = uuid.uuid4()
    db.execute(
        """
        INSERT INTO initiatives (
            id, program_id, name, status, start_date, end_date,
            headcount, irr, revenue, cost, margin
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            initiative_id,
            program_id,
            payload.get("name").strip(),
            payload.get("status", "active"),
            start_date,
            end_date,
            parse_decimal(payload.get("headcount")),
            parse_decimal(payload.get("irr")),
            parse_decimal(payload.get("revenue")),
            parse_decimal(payload.get("cost")),
            parse_decimal(payload.get("margin"))
        )
    )
    log_audit(db, "initiative", initiative_id, "create", get_actor(req), payload)
    return json_response({"id": str(initiative_id)})


def initiative_detail(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    initiative_id = parse_uuid(req.route_params.get("initiative_id"))
    if not initiative_id:
        return json_response({"error": "Invalid initiative id"}, status_code=400)

    if req.method == "DELETE":
        db.execute("DELETE FROM initiatives WHERE id = %s", (initiative_id,))
        log_audit(db, "initiative", initiative_id, "delete", get_actor(req), None)
        return json_response({"status": "deleted"})

    payload = parse_json(req)
    if not payload:
        return json_response({"error": "Body required"}, status_code=400)

    start_date = parse_date(payload.get("startDate"))
    end_date = parse_date(payload.get("endDate"))
    if start_date and end_date and start_date > end_date:
        return json_response(
            {"error": "Start date must be before end date"},
            status_code=400
        )

    db.execute(
        """
        UPDATE initiatives
        SET name = %s,
            status = %s,
            start_date = %s,
            end_date = %s,
            headcount = %s,
            irr = %s,
            revenue = %s,
            cost = %s,
            margin = %s,
            updated_at = now()
        WHERE id = %s
        """,
        (
            payload.get("name"),
            payload.get("status", "active"),
            start_date,
            end_date,
            parse_decimal(payload.get("headcount")),
            parse_decimal(payload.get("irr")),
            parse_decimal(payload.get("revenue")),
            parse_decimal(payload.get("cost")),
            parse_decimal(payload.get("margin")),
            initiative_id
        )
    )
    log_audit(db, "initiative", initiative_id, "update", get_actor(req), payload)
    return json_response({"status": "updated"})


def projects(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    if req.method == "GET":
        rows = db.fetch_all(
                    """
                    SELECT id::text,
                           name,
                           description,
                           business_unit_id::text AS "businessUnitId",
                           business_unit_name AS "businessUnitName",
                           risk_level AS "riskLevel",
                           start_year AS "startYear",
                           start_quarter AS "startQuarter",
                           duration_quarters AS "durationQuarters",
                           minimum_duration_quarters AS "minimumDurationQuarters",
                           resource_allocations AS "resourceAllocations",
                           total_cost AS "totalCost",
                           sm_cost_percentage AS "smCostPercentage",
                           yearly_sustaining_cost AS "yearlySustainingCost",
                           yearly_sustaining_costs AS "yearlySustainingCosts",
                           gross_margin_percentage AS "grossMarginPercentage",
                           gross_margin_percentages AS "grossMarginPercentages",
                           revenue_estimates AS "revenueEstimates",
                           status,
                           visible,
                           parent_project_id::text AS "parentProjectId",
                           master_project_id::text AS "masterProjectId",
                           financial_notes AS "financialNotes",
                           maturity_level AS "maturityLevel",
                           color,
                           created_at AS "createdAt",
                           updated_at AS "updatedAt"
                    FROM projects
                    ORDER BY name
                    """
            )
        return json_response(rows)

    if req.method == "POST":
        payload = parse_json(req)
        if not payload or not payload.get("name"):
            return json_response({"error": "Project name is required"}, status_code=400)

        project_id = uuid.uuid4()
        db.execute(
            """
            INSERT INTO projects (
                id,
                name,
                description,
                business_unit_id,
                business_unit_name,
                risk_level,
                start_year,
                start_quarter,
                duration_quarters,
                minimum_duration_quarters,
                resource_allocations,
                total_cost,
                sm_cost_percentage,
                yearly_sustaining_cost,
                yearly_sustaining_costs,
                gross_margin_percentage,
                gross_margin_percentages,
                revenue_estimates,
                status,
                visible,
                parent_project_id,
                master_project_id,
                financial_notes,
                maturity_level,
                color
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s
            )
            """,
            (
                project_id,
                payload.get("name").strip(),
                payload.get("description"),
                parse_uuid(payload.get("businessUnitId")),
                payload.get("businessUnitName"),
                payload.get("riskLevel"),
                payload.get("startYear"),
                payload.get("startQuarter"),
                payload.get("durationQuarters"),
                payload.get("minimumDurationQuarters"),
                json_dumps(payload.get("resourceAllocations")) if payload.get("resourceAllocations") is not None else None,
                parse_decimal(payload.get("totalCost")),
                parse_decimal(payload.get("smCostPercentage")),
                parse_decimal(payload.get("yearlySustainingCost")),
                json_dumps(payload.get("yearlySustainingCosts")) if payload.get("yearlySustainingCosts") is not None else None,
                parse_decimal(payload.get("grossMarginPercentage")),
                json_dumps(payload.get("grossMarginPercentages")) if payload.get("grossMarginPercentages") is not None else None,
                json_dumps(payload.get("revenueEstimates")) if payload.get("revenueEstimates") is not None else None,
                payload.get("status", "unfunded"),
                parse_bool(payload.get("visible"), True),
                parse_uuid(payload.get("parentProjectId")),
                parse_uuid(payload.get("masterProjectId")),
                payload.get("financialNotes"),
                parse_decimal(payload.get("maturityLevel")),
                payload.get("color"),
            ),
        )
        log_audit(db, "project", project_id, "create", get_actor(req), payload)
        return json_response({"id": str(project_id)})


def project_detail(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    project_id = parse_uuid(req.route_params.get("project_id"))
    if not project_id:
        return json_response({"error": "Invalid project id"}, status_code=400)

    if req.method == "GET":
        row = db.fetch_one(
            """
            SELECT id::text,
                   name,
                   description,
                   business_unit_id::text AS "businessUnitId",
                   business_unit_name AS "businessUnitName",
                   risk_level AS "riskLevel",
                   start_year AS "startYear",
                   start_quarter AS "startQuarter",
                   duration_quarters AS "durationQuarters",
                   minimum_duration_quarters AS "minimumDurationQuarters",
                   resource_allocations AS "resourceAllocations",
                   total_cost AS "totalCost",
                   sm_cost_percentage AS "smCostPercentage",
                   yearly_sustaining_cost AS "yearlySustainingCost",
                   yearly_sustaining_costs AS "yearlySustainingCosts",
                   gross_margin_percentage AS "grossMarginPercentage",
                   gross_margin_percentages AS "grossMarginPercentages",
                   revenue_estimates AS "revenueEstimates",
                   status,
                   visible,
                   parent_project_id::text AS "parentProjectId",
                   master_project_id::text AS "masterProjectId",
                   financial_notes AS "financialNotes",
                   maturity_level AS "maturityLevel",
                   color,
                   created_at AS "createdAt",
                   updated_at AS "updatedAt"
            FROM projects
            WHERE id = %s
            """,
            (project_id,),
        )
        if not row:
            return json_response({"error": "Project not found"}, status_code=404)
        return json_response(row)

    if req.method == "DELETE":
        db.execute("DELETE FROM projects WHERE id = %s", (project_id,))
        log_audit(db, "project", project_id, "delete", get_actor(req), None)
        return json_response({"status": "deleted"})

    payload = parse_json(req)
    if not payload:
        return json_response({"error": "Body required"}, status_code=400)

    db.execute(
        """
        UPDATE projects
        SET name = %s,
            description = %s,
            business_unit_id = %s,
            business_unit_name = %s,
            risk_level = %s,
            start_year = %s,
            start_quarter = %s,
            duration_quarters = %s,
            minimum_duration_quarters = %s,
            resource_allocations = %s,
            total_cost = %s,
            sm_cost_percentage = %s,
            yearly_sustaining_cost = %s,
            yearly_sustaining_costs = %s,
            gross_margin_percentage = %s,
            gross_margin_percentages = %s,
            revenue_estimates = %s,
            status = %s,
            visible = %s,
            parent_project_id = %s,
            master_project_id = %s,
            financial_notes = %s,
            maturity_level = %s,
            color = %s,
            updated_at = now()
        WHERE id = %s
        """,
        (
            payload.get("name"),
            payload.get("description"),
            parse_uuid(payload.get("businessUnitId")),
            payload.get("businessUnitName"),
            payload.get("riskLevel"),
            payload.get("startYear"),
            payload.get("startQuarter"),
            payload.get("durationQuarters"),
            payload.get("minimumDurationQuarters"),
            json_dumps(payload.get("resourceAllocations")) if payload.get("resourceAllocations") is not None else None,
            parse_decimal(payload.get("totalCost")),
            parse_decimal(payload.get("smCostPercentage")),
            parse_decimal(payload.get("yearlySustainingCost")),
            json_dumps(payload.get("yearlySustainingCosts")) if payload.get("yearlySustainingCosts") is not None else None,
            parse_decimal(payload.get("grossMarginPercentage")),
            json_dumps(payload.get("grossMarginPercentages")) if payload.get("grossMarginPercentages") is not None else None,
            json_dumps(payload.get("revenueEstimates")) if payload.get("revenueEstimates") is not None else None,
            payload.get("status"),
            parse_bool(payload.get("visible"), True),
            parse_uuid(payload.get("parentProjectId")),
            parse_uuid(payload.get("masterProjectId")),
            payload.get("financialNotes"),
            parse_decimal(payload.get("maturityLevel")),
            payload.get("color"),
            project_id,
        ),
    )
    log_audit(db, "project", project_id, "update", get_actor(req), payload)
    return json_response({"status": "updated"})


def business_units(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    if req.method == "GET":
        rows = db.fetch_all(
            """
            SELECT id::text, name, description, parent_unit_id::text AS "parentUnitId"
            FROM business_units
            ORDER BY name
            """
        )
        return json_response(rows)

    payload = parse_json(req)
    if not payload or not payload.get("name"):
        return json_response({"error": "Business unit name is required"}, status_code=400)

    bu_id = uuid.uuid4()
    db.execute(
        """
        INSERT INTO business_units (id, name, description, parent_unit_id)
        VALUES (%s, %s, %s, %s)
        """,
        (
            bu_id,
            payload.get("name").strip(),
            payload.get("description"),
            parse_uuid(payload.get("parentUnitId")),
        ),
    )
    log_audit(db, "business_unit", bu_id, "create", get_actor(req), payload)
    return json_response({"id": str(bu_id)})


def business_unit_detail(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    bu_id = parse_uuid(req.route_params.get("business_unit_id"))
    if not bu_id:
        return json_response({"error": "Invalid business unit id"}, status_code=400)

    if req.method == "DELETE":
        db.execute("DELETE FROM business_units WHERE id = %s", (bu_id,))
        log_audit(db, "business_unit", bu_id, "delete", get_actor(req), None)
        return json_response({"status": "deleted"})

    payload = parse_json(req)
    if not payload:
        return json_response({"error": "Body required"}, status_code=400)

    db.execute(
        """
        UPDATE business_units
        SET name = %s,
            description = %s,
            parent_unit_id = %s,
            updated_at = now()
        WHERE id = %s
        """,
        (
            payload.get("name"),
            payload.get("description"),
            parse_uuid(payload.get("parentUnitId")),
            bu_id,
        ),
    )
    log_audit(db, "business_unit", bu_id, "update", get_actor(req), payload)
    return json_response({"status": "updated"})


def competences(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    if req.method == "GET":
        rows = db.fetch_all(
            """
            SELECT id::text,
                   name,
                   description,
                   category,
                   average_salary AS "averageSalary"
            FROM competences
            ORDER BY name
            """
        )
        return json_response(rows)

    payload = parse_json(req)
    if not payload or not payload.get("name"):
        return json_response({"error": "Competence name is required"}, status_code=400)

    competence_id = uuid.uuid4()
    db.execute(
        """
        INSERT INTO competences (id, name, description, category, average_salary)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            competence_id,
            payload.get("name").strip(),
            payload.get("description"),
            payload.get("category"),
            parse_decimal(payload.get("averageSalary")),
        ),
    )
    log_audit(db, "competence", competence_id, "create", get_actor(req), payload)
    return json_response({"id": str(competence_id)})


def competence_detail(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    competence_id = parse_uuid(req.route_params.get("competence_id"))
    if not competence_id:
        return json_response({"error": "Invalid competence id"}, status_code=400)

    if req.method == "DELETE":
        db.execute("DELETE FROM competences WHERE id = %s", (competence_id,))
        log_audit(db, "competence", competence_id, "delete", get_actor(req), None)
        return json_response({"status": "deleted"})

    payload = parse_json(req)
    if not payload:
        return json_response({"error": "Body required"}, status_code=400)

    db.execute(
        """
        UPDATE competences
        SET name = %s,
            description = %s,
            category = %s,
            average_salary = %s,
            updated_at = now()
        WHERE id = %s
        """,
        (
            payload.get("name"),
            payload.get("description"),
            payload.get("category"),
            parse_decimal(payload.get("averageSalary")),
            competence_id,
        ),
    )
    log_audit(db, "competence", competence_id, "update", get_actor(req), payload)
    return json_response({"status": "updated"})


def resources(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    if req.method == "GET":
        rows = db.fetch_all(
            """
            SELECT id::text,
                   competence_id::text AS "competenceId",
                   competence_name AS "competenceName",
                   quantity,
                   yearly_wage AS "yearlyWage",
                   business_unit_id::text AS "businessUnitId",
                   business_unit_name AS "businessUnitName",
                   skills,
                   name,
                   is_ai AS "isAI"
            FROM resources
            ORDER BY competence_name
            """
        )
        return json_response(rows)

    payload = parse_json(req)
    if not payload or not payload.get("competenceId"):
        return json_response({"error": "Competence is required"}, status_code=400)

    resource_id = uuid.uuid4()
    db.execute(
        """
        INSERT INTO resources (
            id,
            competence_id,
            competence_name,
            quantity,
            yearly_wage,
            business_unit_id,
            business_unit_name,
            skills,
            name,
            is_ai
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            resource_id,
            parse_uuid(payload.get("competenceId")),
            payload.get("competenceName"),
            parse_decimal(payload.get("quantity")),
            parse_decimal(payload.get("yearlyWage")),
            parse_uuid(payload.get("businessUnitId")),
            payload.get("businessUnitName"),
            json_dumps(payload.get("skills")) if payload.get("skills") is not None else None,
            payload.get("name"),
            parse_bool(payload.get("isAI"), False),
        ),
    )
    log_audit(db, "resource", resource_id, "create", get_actor(req), payload)
    return json_response({"id": str(resource_id)})


def resource_detail(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    resource_id = parse_uuid(req.route_params.get("resource_id"))
    if not resource_id:
        return json_response({"error": "Invalid resource id"}, status_code=400)

    if req.method == "DELETE":
        db.execute("DELETE FROM resources WHERE id = %s", (resource_id,))
        log_audit(db, "resource", resource_id, "delete", get_actor(req), None)
        return json_response({"status": "deleted"})

    payload = parse_json(req)
    if not payload:
        return json_response({"error": "Body required"}, status_code=400)

    db.execute(
        """
        UPDATE resources
        SET competence_id = %s,
            competence_name = %s,
            quantity = %s,
            yearly_wage = %s,
            business_unit_id = %s,
            business_unit_name = %s,
            skills = %s,
            name = %s,
            is_ai = %s,
            updated_at = now()
        WHERE id = %s
        """,
        (
            parse_uuid(payload.get("competenceId")),
            payload.get("competenceName"),
            parse_decimal(payload.get("quantity")),
            parse_decimal(payload.get("yearlyWage")),
            parse_uuid(payload.get("businessUnitId")),
            payload.get("businessUnitName"),
            json_dumps(payload.get("skills")) if payload.get("skills") is not None else None,
            payload.get("name"),
            parse_bool(payload.get("isAI"), False),
            resource_id,
        ),
    )
    log_audit(db, "resource", resource_id, "update", get_actor(req), payload)
    return json_response({"status": "updated"})


def resource_gaps(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    initiative_ids = parse_initiative_ids(req)
    where_clause, params = build_initiative_filter(initiative_ids)
    rows = db.fetch_all(
        f"""
        SELECT initiative_id::text AS "initiativeId",
               quarter,
               expertise,
               headcount AS gap
        FROM initiative_resources
        {where_clause}
        ORDER BY quarter, expertise
        """,
        tuple(params) if params else None
    )
    return json_response(rows)


def financial_impact(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    initiative_ids = parse_initiative_ids(req)
    where_clause, params = build_initiative_filter(initiative_ids, "f.initiative_id")
    rows = db.fetch_all(
        f"""
        SELECT f.initiative_id::text AS "initiativeId",
               i.name AS "initiativeName",
               f.quarter,
               f.revenue,
               f.cost,
               f.margin,
               f.cash_flow AS "cashFlow",
               f.irr
        FROM initiative_financials f
        LEFT JOIN initiatives i ON i.id = f.initiative_id
        {where_clause}
        ORDER BY f.quarter, i.name
        """,
        tuple(params) if params else None
    )
    return json_response(rows)


def calculations(req: func.HttpRequest) -> func.HttpResponse:
    db, error = require_connection()
    if error:
        return error

    initiative_ids = parse_initiative_ids(req)
    initiative_filter, params = build_initiative_filter(initiative_ids, "i.id")
    initiatives = db.fetch_all(
        f"""
        SELECT i.id::text,
               i.name,
               i.start_date,
               i.end_date,
               i.cost,
               i.revenue,
               i.irr,
               p.name AS "programName"
        FROM initiatives i
        LEFT JOIN programs p ON p.id = i.program_id
        {initiative_filter}
        ORDER BY i.name
        """,
        tuple(params) if params else None
    )

    financial_filter, financial_params = build_initiative_filter(
        initiative_ids,
        "f.initiative_id"
    )
    financials = db.fetch_all(
        f"""
        SELECT f.initiative_id::text AS "initiativeId",
               f.quarter,
               f.revenue,
               f.cost,
               f.cash_flow AS "cashFlow",
               f.irr
        FROM initiative_financials f
        {financial_filter}
        ORDER BY f.quarter
        """,
        tuple(financial_params) if financial_params else None
    )

    starts = [row.get("start_date") for row in initiatives if row.get("start_date")]
    ends = [row.get("end_date") for row in initiatives if row.get("end_date")]
    timeline = {
        "start": min(starts) if starts else None,
        "end": max(ends) if ends else None,
        "initiatives": [
            {
                "id": row.get("id"),
                "name": row.get("name"),
                "start": row.get("start_date"),
                "end": row.get("end_date")
            }
            for row in initiatives
        ]
    }

    cash_flow_by_quarter = {}
    irr_by_quarter = {}
    cost_distribution = {}
    total_cost = 0
    total_revenue = 0
    total_cash_flow = 0

    for entry in financials:
        quarter = entry.get("quarter") or "Unknown"
        cash_flow_by_quarter.setdefault(quarter, 0)
        irr_by_quarter.setdefault(quarter, {"sum": 0, "count": 0})
        cost_distribution.setdefault(entry.get("initiativeId"), 0)

        cash_flow_by_quarter[quarter] += entry.get("cashFlow") or 0
        irr_by_quarter[quarter]["sum"] += entry.get("irr") or 0
        irr_by_quarter[quarter]["count"] += 1

        cost = entry.get("cost") or 0
        revenue = entry.get("revenue") or 0
        total_cost += cost
        total_revenue += revenue
        total_cash_flow += entry.get("cashFlow") or 0
        cost_distribution[entry.get("initiativeId")] += cost

    cash_flow_rows = [
        {"quarter": quarter, "cashFlow": value}
        for quarter, value in cash_flow_by_quarter.items()
    ]
    irr_rows = [
        {
            "quarter": quarter,
            "irr": values["sum"] / values["count"] if values["count"] else None
        }
        for quarter, values in irr_by_quarter.items()
    ]

    cost_rows = []
    for initiative in initiatives:
        initiative_id = initiative.get("id")
        cost = cost_distribution.get(initiative_id, 0)
        percent = cost / total_cost if total_cost else None
        cost_rows.append({
            "initiativeId": initiative_id,
            "initiativeName": initiative.get("name"),
            "programName": initiative.get("programName"),
            "cost": cost,
            "percent": percent
        })

    return json_response({
        "initiativeCount": len(initiatives),
        "timeline": timeline,
        "cashFlowByQuarter": cash_flow_rows,
        "irrByQuarter": irr_rows,
        "costDistribution": cost_rows,
        "totals": {
            "cost": total_cost,
            "revenue": total_revenue,
            "cashFlow": total_cash_flow
        }
    })
