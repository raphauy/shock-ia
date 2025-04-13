import { getAllFeeds } from "@/services/product-services";
import { FeedCard } from "./feed-card";
import SyncButton from "./sync-button";

export const maxDuration = 800

export default async function ProductFeeds() {
  const feeds = await getAllFeeds();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sincronización de Productos</h1>
        <SyncButton />
      </div>
      <div className="space-y-4">
        {feeds.map((feed) => (
          <FeedCard key={feed.id} feed={feed} />
        ))}
      </div>
    </div>
  );
}