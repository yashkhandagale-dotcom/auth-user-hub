import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  MoreHorizontal,
  Monitor,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Link,
  RefreshCw,
} from "lucide-react";
import { useDevices } from "@/hooks/useDevices";
import { ApiDevice } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type SortField = "deviceName" | "description" | "assetName";
type SortDirection = "asc" | "desc";

const DeviceManagement = () => {
  const {
    devices,
    isLoading,
    isError,
    error,
    createDevice,
    updateDevice,
    deleteDevice,
    bulkDeleteDevices,
    isCreating,
    isUpdating,
    isDeleting,
    isBulkDeleting,
    refetch,
  } = useDevices();

  const [searchTerm, setSearchTerm] = useState("");
  const [configuredFilter, setConfiguredFilter] = useState<"all" | "configured" | "unassigned">("all");
  const [sortField, setSortField] = useState<SortField>("deviceName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedDevices, setSelectedDevices] = useState<number[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<ApiDevice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    deviceName: "",
    description: "",
  });

  // Filter and sort devices
  const filteredDevices = devices
    .filter((device) => {
      const matchesSearch =
        device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesFilter = 
        configuredFilter === "all" ||
        (configuredFilter === "configured" && device.assetId !== null) ||
        (configuredFilter === "unassigned" && device.assetId === null);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "deviceName":
          comparison = a.deviceName.localeCompare(b.deviceName);
          break;
        case "description":
          comparison = a.description.localeCompare(b.description);
          break;
        case "assetName":
          comparison = (a.assetName || "").localeCompare(b.assetName || "");
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Pagination
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDevices(paginatedDevices.map((d) => d.id));
    } else {
      setSelectedDevices([]);
    }
  };

  const handleSelectDevice = (deviceId: number, checked: boolean) => {
    if (checked) {
      setSelectedDevices([...selectedDevices, deviceId]);
    } else {
      setSelectedDevices(selectedDevices.filter((id) => id !== deviceId));
    }
  };

  const handleCreateDevice = () => {
    setEditingDevice(null);
    setFormData({
      deviceName: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditDevice = (device: ApiDevice) => {
    setEditingDevice(device);
    setFormData({
      deviceName: device.deviceName,
      description: device.description,
    });
    setIsDialogOpen(true);
  };

  const handleSaveDevice = () => {
    if (!formData.deviceName.trim()) {
      return;
    }

    if (editingDevice) {
      updateDevice({
        id: editingDevice.id,
        data: {
          deviceName: formData.deviceName,
          description: formData.description,
        },
      });
    } else {
      createDevice({
        deviceName: formData.deviceName,
        description: formData.description,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDeleteDevice = (deviceId: number) => {
    deleteDevice(deviceId);
    setSelectedDevices(selectedDevices.filter((id) => id !== deviceId));
  };

  const handleBulkDelete = () => {
    bulkDeleteDevices(selectedDevices);
    setSelectedDevices([]);
  };

  const exportToCSV = () => {
    const headers = ["ID", "Device Name", "Description", "Asset ID", "Asset Name"];
    const rows = filteredDevices.map((d) => [
      d.id.toString(),
      d.deviceName,
      d.description,
      d.assetId?.toString() || "",
      d.assetName || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devices.csv";
    a.click();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading devices...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading devices</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load devices. Please try again."}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Device Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and configure all devices in your organization.
          </p>
        </div>
        <Button onClick={handleCreateDevice} className="gap-2" disabled={isCreating}>
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add Device
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={configuredFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setConfiguredFilter("all")}
              >
                All
              </Button>
              <Button
                variant={configuredFilter === "configured" ? "default" : "outline"}
                size="sm"
                onClick={() => setConfiguredFilter("configured")}
              >
                Configured
              </Button>
              <Button
                variant={configuredFilter === "unassigned" ? "default" : "outline"}
                size="sm"
                onClick={() => setConfiguredFilter("unassigned")}
              >
                Unassigned
              </Button>
            </div>
            <Button variant="outline" onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedDevices.length > 0 && (
        <Card className="border-primary">
          <CardContent className="p-4 flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">
              {selectedDevices.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="gap-2"
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Selected
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Devices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      paginatedDevices.length > 0 &&
                      paginatedDevices.every((d) => selectedDevices.includes(d.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("deviceName")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Device Name
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("description")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Description
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("assetName")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Linked Asset
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm || configuredFilter !== "all" 
                      ? "No devices match your filters" 
                      : "No devices found. Click 'Add Device' to create one."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedDevices.includes(device.id)}
                        onCheckedChange={(checked) =>
                          handleSelectDevice(device.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      #{device.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="font-medium">{device.deviceName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {device.description || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {device.assetName ? (
                        <div className="flex items-center gap-2">
                          <Link className="h-3 w-3 text-muted-foreground" />
                          <span>{device.assetName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          device.assetId
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                        }
                      >
                        {device.assetId ? "Configured" : "Unassigned"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditDevice(device)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteDevice(device.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredDevices.length)} of{" "}
            {filteredDevices.length} devices
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDevice ? "Edit Device" : "Add New Device"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">
                Device Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deviceName"
                value={formData.deviceName}
                onChange={(e) =>
                  setFormData({ ...formData, deviceName: e.target.value })
                }
                placeholder="Enter device name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter device description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveDevice} 
              disabled={!formData.deviceName.trim() || isCreating || isUpdating}
            >
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingDevice ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeviceManagement;
