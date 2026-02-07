import sb from '../lib/snackbase';
import type { Activity, CreateActivity } from '../types';

export const activitiesService = {
  async getActivities(): Promise<Activity[]> {
    const records = await sb.records.list<Activity>('activities');
    return records.items;
  },

  async createActivity(data: CreateActivity): Promise<Activity> {
    const record = await sb.records.create<Activity>('activities', data);
    return record;
  }
};

