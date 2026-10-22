import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { requestsQuery } from "@/lib/listings";
import { PageTitle, RequestCard, btnGold } from "@/components/site";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "طلبات البحث عن عقارات | منزلي وأرضي" },
      { name: "description", content: "تصفح طلبات المستأجرين الباحثين عن عقارات في الجزائر." },
      { property: "og:title", content: "طلبات البحث عن عقارات" },
      { property: "og:description", content: "مستأجرون يبحثون عن عقارك الآن." },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const { data: requests, isError } = useQuery(requestsQuery);
  return (
    <>
      <PageTitle title="طلبات البحث عن عقارات" sub="هل لديك عقار يناسب أحد هذه الطلبات؟" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/request-new" className={`${btnGold} inline-block`}>
          انشر طلب بحث
        </Link>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(requests ?? []).map((r) => (
            <RequestCard key={r.id} r={r} />
          ))}
        </div>
        {isError && (
          <p role="alert" className="py-8 text-center text-destructive">
            تعذر تحميل الطلبات.
          </p>
        )}
        {requests && !requests.length && (
          <p className="py-16 text-center text-muted-foreground">لا توجد طلبات بحث منشورة بعد.</p>
        )}
      </div>
    </>
  );
}
