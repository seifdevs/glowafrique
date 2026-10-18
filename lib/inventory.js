import { updatedDocument } from './auth.js';

export async function reserveInventory(database, items, { session } = {}) {
  const inventory = database.collection('glowafrique_inventory');
  if (!session) await inventory.createIndex({ productId: 1 }, { unique: true });
  const reserved = [];
  try {
    for (const item of items) {
      const result = await inventory.findOneAndUpdate(
        { productId: item.productId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity }, $set: { updatedAt: new Date() } },
        { returnDocument: 'after', ...(session ? { session } : {}) },
      );
      const stock = updatedDocument(result);
      if (!stock) {
        const current = await inventory.findOne(
          { productId: item.productId },
          { projection: { quantity: 1 }, ...(session ? { session } : {}) },
        );
        const error = new Error(
          !current
            ? `${item.productName} is not available for ordering yet.`
            : `${item.productName} does not have enough stock for this quantity.`,
        );
        error.statusCode = 409;
        throw error;
      }
      reserved.push({ productId: item.productId, quantity: item.quantity });
    }
    return { inventory, reserved };
  } catch (error) {
    if (!session) await releaseReservedInventory(inventory, reserved);
    throw error;
  }
}

export async function releaseReservedInventory(inventory, reservations) {
  for (const item of reservations) {
    await inventory
      .updateOne(
        { productId: item.productId },
        { $inc: { quantity: item.quantity }, $set: { updatedAt: new Date() } },
      )
      .catch((error) => console.error('[inventory] stock rollback failed:', error && error.name));
  }
}
