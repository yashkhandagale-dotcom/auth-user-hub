import { useNavigate } from "react-router-dom";
import {
  Monitor,
  Package,
  Users,
  Activity,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

import { devicesApi } from "@/lib/api/devices-api";
import { assetsApi } from "@/lib/api/assets-api";

// TEMP (until backend APIs exist)
import { mockUsers, mockActivities } from "@/data/mockData";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  /* -------------------- API QUERIES -------------------- */

  const {
    data: devices = [],
    isLoading: devicesLoading,
    isError: devicesError,
  } = useQuery({
    queryKey: ["devices"],
    queryFn: devicesApi.getAll,
  });

  const {
    data: assets = [],
    isLoading: assetsLoading,
    isError: assetsError,
  } = useQuery({
    queryKey: ["assets"],
    queryFn: assetsApi.getAll,
  });

  /* -------------------- STATES -------------------- */

  if (devicesLoading || assetsLoading) {
    return (
      <div className="text-muted-foreground text-sm">
        Loading dashboard...
      </div>
    );
  }

  if (devicesError || assetsError) {
    return (
      <div className="text-destructive text-sm">
        Failed to load dashboard data
      </div>
    );
  }

  /* -------------------- STATS -------------------- */

  const totalDevices = devices.length;
  const activeDevices = devices.filter(
    (d) => d.status === "active"
  ).length;

  const totalAssets = assets.length;
  const assetsInUse = assets.filter(
    (a) => a.status === "in_use"
  ).length;

  const activeUsers = mockUsers.filter((u) => u.isActive).length;

  /* -------------------- HELPERS -------------------- */

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "device":
        return <Monitor className="h-4 w-4" />;
      case "asset":
        return <Package className="h-4 w-4" />;
      case "user":
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case "created":
        return "text-green-500 bg-green-500/10";
      case "updated":
        return "text-blue-500 bg-blue-500/10";
      case "deleted":
        return "text-destructive bg-destructive/10";
      case "assigned":
        return "text-purple-500 bg-purple-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  /* -------------------- UI -------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your asset management system
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Devices"
          value={totalDevices}
          subtitle={`${activeDevices} active`}
          icon={<Monitor className="h-5 w-5 text-primary" />}
        />

        <StatCard
          title="Total Assets"
          value={totalAssets}
          subtitle={`${assetsInUse} in use`}
          icon={<Package className="h-5 w-5 text-primary" />}
        />

        <StatCard
          title="Active Users"
          value={activeUsers}
          subtitle={`${mockUsers.length} total users`}
          icon={<Users className="h-5 w-5 text-primary" />}
        />

        <StatCard
          title="Recent Activity"
          value={mockActivities.length}
          subtitle="Last 24 hours"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
        />
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickLink
          icon={<Monitor className="h-6 w-6 text-primary" />}
          title="Device Management"
          subtitle="Manage all devices"
          onClick={() => navigate("/devices")}
        />

        <QuickLink
          icon={<Package className="h-6 w-6 text-primary" />}
          title="Asset Management"
          subtitle="Manage all assets"
          onClick={() => navigate("/assets")}
        />

        {isAdmin && (
          <QuickLink
            icon={<Users className="h-6 w-6 text-primary" />}
            title="User Management"
            subtitle="Manage users & roles"
            onClick={() => navigate("/users")}
          />
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {mockActivities.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${getActivityColor(
                  activity.action
                )}`}
              >
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  by {activity.userName}
                </p>
              </div>

              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                })}
              </span>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/devices")}
          >
            View All Activity
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

/* -------------------- SMALL COMPONENTS -------------------- */

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm text-muted-foreground">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">
        {subtitle}
      </p>
    </CardContent>
  </Card>
);

const QuickLink = ({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) => (
  <Card
    onClick={onClick}
    className="cursor-pointer hover:shadow-md transition"
  >
    <CardContent className="p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground" />
    </CardContent>
  </Card>
);

export default Dashboard;
