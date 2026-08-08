import cycles from "@cycles";

type Cycle = (typeof cycles)[number];

export default async function setSymbol({
  singleCycle,
  size = "4px",
}: {
  singleCycle: Cycle;
  size?: string;
}) {
  let setSymbolSvg: string | null = null;
  if (singleCycle.setSymbol) {
    try {
      setSymbolSvg = await fetch(singleCycle.setSymbol).then((r) => r.text());
    } catch {
      setSymbolSvg = null;
    }
  }

  return (
    <>
      {" "}
      {setSymbolSvg && (
        <span
          aria-label="simbolo do set"
          role="img"
          style={{ width: size, height: size }}
          className="inline-block **:fill-current [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: setSymbolSvg }}
        />
      )}
    </>
  );
}
