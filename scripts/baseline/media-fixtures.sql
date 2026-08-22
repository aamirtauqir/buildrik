-- The media library must hold assets or BL-0161 (grid) and BL-0162 (list) are
-- byte-identical: with nothing in it both views render the same empty state, so
-- the difference those two frames exist to show cannot exist.
--
-- Three rows, one of them a video, because the library filters by type and a
-- single image would leave the Video pill with nothing behind it.
INSERT INTO media_assets (id, "userId", "siteId", url, bytes, type, "mimeType", filename, "altText", "createdAt", "updatedAt")
VALUES
 ('bl_fixture_asset_0001', 'cmpa9ohx10000wrjux4ecumzo', 'cmrsur1fp000unh3rvmmiq25t',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', 184320, 'image', 'image/jpeg',
  'storefront.jpg', 'A shop front at street level', now(), now()),
 ('bl_fixture_asset_0002', 'cmpa9ohx10000wrjux4ecumzo', 'cmrsur1fp000unh3rvmmiq25t',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 262144, 'image', 'image/jpeg',
  'dining-room.jpg', 'Tables set for service', now(), now()),
 ('bl_fixture_asset_0003', 'cmpa9ohx10000wrjux4ecumzo', 'cmrsur1fp000unh3rvmmiq25t',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800', 331776, 'video', 'video/mp4',
  'room-tour.mp4', 'Walkthrough of the dining room', now(), now())
ON CONFLICT (id) DO NOTHING;
