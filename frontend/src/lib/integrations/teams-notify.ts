export interface TeamsMessage {
  title: string;
  body: string;
  urgency?: 'normal' | 'urgent';
  recipients?: string[];
  channelId?: string;
  projectId?: string;
}

export interface TeamsNotificationAdapter {
  sendMessage(message: TeamsMessage): Promise<boolean>;
  sendAlert(ruleId: string, entityType: string, entityId: string, message: string): Promise<boolean>;
}

export class MockTeamsNotificationAdapter implements TeamsNotificationAdapter {
  async sendMessage(message: TeamsMessage): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MockTeams] Would send message:', message);
    }
    return true;
  }

  async sendAlert(ruleId: string, entityType: string, entityId: string, message: string): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MockTeams] Alert fired:', { ruleId, entityType, entityId, message });
    }
    return true;
  }
}
