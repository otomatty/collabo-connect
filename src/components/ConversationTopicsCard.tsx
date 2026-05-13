import { Card, CardContent } from "@/components/ui/card";
import type { ConversationTopic } from "@/types/profile";

interface ConversationTopicsCardProps {
  topics: ConversationTopic[];
}

export default function ConversationTopicsCard({
  topics,
}: ConversationTopicsCardProps) {
  if (topics.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold mb-2">
        <span aria-hidden="true">💬 </span>こんな話題で盛り上がれそう
      </h2>
      <div className="space-y-2">
        {topics.map((topic, idx) => (
          <Card key={`${topic.title}-${idx}`}>
            <CardContent className="p-4 flex gap-3">
              <span className="text-2xl leading-none shrink-0" aria-hidden>
                {topic.emoji}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{topic.title}</p>
                {topic.description ? (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {topic.description}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
