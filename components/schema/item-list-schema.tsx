import { buildItemListStructuredData, type ItemListEntry } from "@/lib/structured-data";

export function ItemListSchema({
  name,
  items
}: {
  name: string;
  items: ItemListEntry[];
}) {
  if (!items.length) {
    return null;
  }

  const schema = buildItemListStructuredData(name, items);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
