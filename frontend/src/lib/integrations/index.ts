import { MockHrSyncAdapter, type HrSyncAdapter } from './hr-sync';
import { MockOracleErpAdapter, type OracleErpAdapter } from './oracle-erp';
import { MockMsProjectAdapter, type MsProjectAdapter } from './ms-project';
import { MockTeamsNotificationAdapter, type TeamsNotificationAdapter } from './teams-notify';

export type { HrSyncAdapter } from './hr-sync';
export type { OracleErpAdapter } from './oracle-erp';
export type { MsProjectAdapter } from './ms-project';
export type { TeamsNotificationAdapter } from './teams-notify';
export { type HrEmployee } from './hr-sync';
export { type OracleActual } from './oracle-erp';
export { type MsProjectTask, type MsProjectSchedule } from './ms-project';
export { type TeamsMessage } from './teams-notify';

// Factory functions — swap mock for real by changing one line
export function createHrSyncAdapter(): HrSyncAdapter {
  return new MockHrSyncAdapter();
}

export function createOracleErpAdapter(): OracleErpAdapter {
  return new MockOracleErpAdapter();
}

export function createMsProjectAdapter(): MsProjectAdapter {
  return new MockMsProjectAdapter();
}

export function createTeamsNotificationAdapter(): TeamsNotificationAdapter {
  return new MockTeamsNotificationAdapter();
}
