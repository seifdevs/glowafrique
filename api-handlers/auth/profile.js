import {
  authHeaders,
  authenticatedUser,
  getAuthCollections,
  parseBody,
  rateLimit,
  sameOriginRequest,
} from '../../lib/auth.js';

export default async function profile(req, res) {
  authHeaders(res);
  if (!['GET', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (await rateLimit(req, res, 'auth-profile')) return;
  try {
    const user = await authenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Please sign in.' });
    if (req.method === 'PATCH') {
      if (sameOriginRequest(req, res)) return;
      const body = parseBody(req);
      const firstName = String(body.firstName || '').trim(),
        lastName = String(body.lastName || '').trim();
      if (!firstName || firstName.length > 80 || !lastName || lastName.length > 80)
        return res.status(400).json({ error: 'Enter a valid first and last name.' });
      const phone = String(body.phone || '').trim();
      if (phone && !/^[+\d() .-]{8,32}$/.test(phone))
        return res
          .status(400)
          .json({ error: 'Enter a valid phone number, including country code.' });
      const rawAddress = body.address && typeof body.address === 'object' ? body.address : {};
      const address = {
        addressLine1: String(rawAddress.addressLine1 || '').trim(),
        addressLine2: String(rawAddress.addressLine2 || '').trim(),
        city: String(rawAddress.city || '').trim(),
        region: String(rawAddress.division || rawAddress.region || '').trim(),
        division: String(rawAddress.division || rawAddress.region || '').trim(),
        postalCode: String(rawAddress.postalCode || '').trim(),
        country: String(rawAddress.country || '').trim(),
        deliveryInstructions: String(rawAddress.deliveryInstructions || '').trim(),
      };
      const hasAddress = Object.values(address).some(Boolean);
      if (
        hasAddress &&
        (!address.addressLine1 ||
          address.addressLine1.length > 180 ||
          address.addressLine2.length > 180 ||
          !address.city ||
          address.city.length > 100 ||
          !address.region ||
          address.region.length > 100 ||
          address.postalCode.length > 20 ||
          address.country.length > 80 ||
          address.deliveryInstructions.length > 500)
      ) {
        return res.status(400).json({
          error:
            'Enter a street address, city, and region. Check the length of the other address fields.',
        });
      }
      const { users } = await getAuthCollections();
      const set = { firstName, lastName, phone, updatedAt: new Date() };
      if (hasAddress) set.address = address;
      const update = { $set: set };
      if (body.removeAddress === true && !hasAddress) update.$unset = { address: '' };
      await users.updateOne({ _id: user._id }, update);
      return res.status(200).json({
        firstName,
        lastName,
        email: user.email,
        phone,
        address:
          body.removeAddress === true && !hasAddress
            ? null
            : hasAddress
              ? address
              : user.address || null,
        memberSince: user.createdAt,
      });
    }
    return res.status(200).json({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone || '',
      address: user.address || null,
      memberSince: user.createdAt,
    });
  } catch (_) {
    return res.status(503).json({ error: 'Account service is temporarily unavailable.' });
  }
}
