import { getDatabase } from './auth.js';

const SETTING_ID = 'public-storefront';

export async function getMaintenanceSetting() {
  const database = await getDatabase();
  const setting = await database.collection('glowafrique_settings').findOne({ _id: SETTING_ID });
  return { enabled: setting?.maintenanceEnabled === true, updatedAt: setting?.updatedAt || null };
}

export async function setMaintenanceSetting(enabled, actorUserId) {
  const database = await getDatabase();
  const updatedAt = new Date();
  await database.collection('glowafrique_settings').updateOne(
    { _id: SETTING_ID },
    { $set: { maintenanceEnabled: enabled, updatedAt, updatedBy: actorUserId } },
    { upsert: true },
  );
  return { enabled, updatedAt };
}
