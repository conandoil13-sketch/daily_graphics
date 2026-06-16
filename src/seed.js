export function getExhibitSeed() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("seed") || "").trim();
}

export function getRenderSeed(dateKey) {
  const exhibitSeed = getExhibitSeed();
  return exhibitSeed ? `${dateKey}::${exhibitSeed}` : dateKey;
}
