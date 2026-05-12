import Dashboard from "@/components/features/dashboard-pymes/Dashboard";

interface PageProps {
  params: Promise<{
    datasetId: string;
  }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Dashboard defaultDatasetId={resolvedParams.datasetId} />
    </div>
  );
}
