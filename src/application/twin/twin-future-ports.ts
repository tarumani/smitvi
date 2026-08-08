/** Future multi-twin discovery — architecture stub only (Phase 4). */
export interface TwinDiscoveryPort {
  findExpertsForTopic(input: {
    viewerUserId: string;
    topic: string;
  }): Promise<Array<{ userId: string; username: string; match: number }>>;
}

export class StubTwinDiscoveryPort implements TwinDiscoveryPort {
  async findExpertsForTopic() {
    return [];
  }
}

/** Future twin-to-twin collaboration — stub only. */
export interface TwinCollaborationPort {
  planCollaboration(input: {
    participantUserIds: string[];
    goal: string;
  }): Promise<{ status: "not_implemented" }>;
}

export class StubTwinCollaborationPort implements TwinCollaborationPort {
  async planCollaboration() {
    return { status: "not_implemented" as const };
  }
}
