
import { Card } from "@/components/ui/card";

export const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground px-4">Settings</h1>
      <Card className="mx-4 p-6 sm:p-8 bg-card border-border shadow-card">
        <div className="text-center space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-card-foreground">
            Account & API Management
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Manage users, billing, subscription status, and API configurations.
          </p>
        </div>
      </Card>
    </div>
  );
};
