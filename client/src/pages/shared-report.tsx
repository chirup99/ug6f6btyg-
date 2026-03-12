import { useEffect } from "react";
import { useParams, useLocation, Redirect } from "wouter";

export default function SharedReport() {
  const { reportId } = useParams<{ reportId: string }>();
  const [, setLocation] = useLocation();

  // Redirect to home page with shared report query parameter
  // Home page will handle fetching and displaying the report dialog
  useEffect(() => {
    if (reportId) {
      setLocation(`/?sharedReport=${reportId}`);
    }
  }, [reportId, setLocation]);

  // Show minimal loading state during redirect
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
        <div className="w-4 h-4 bg-primary rounded-full animate-pulse delay-75" />
        <div className="w-4 h-4 bg-primary rounded-full animate-pulse delay-150" />
      </div>
    </div>
  );
}
