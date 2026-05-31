export interface Station {
  id: string;
  name: string;
  url: string;
  rdsUrl?: string;
}

export type AppView = 'player' | 'server' | 'remote';
