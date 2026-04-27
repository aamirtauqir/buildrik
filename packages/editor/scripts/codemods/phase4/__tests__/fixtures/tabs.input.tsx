export function Demo() {
  const tabs = [
    { id: "a", label: "A", content: <div>A</div> },
    { id: "b", label: "B", content: <div>B</div> },
  ];
  return (
    <div>
      <Tabs tabs={tabs} activeTab="a" onChange={() => undefined} />
    </div>
  );
}
