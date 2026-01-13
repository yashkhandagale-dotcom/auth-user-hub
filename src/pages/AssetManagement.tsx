import { useState } from "react";
import {
  Plus,
  Search,
  Download,
  Trash2,
  Edit,
  MoreHorizontal,
  Package,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Link,
  RefreshCw,
  Settings,
} from "lucide-react";
import { useAssets } from "@/hooks/useAssets";
import { ApiAsset, ApiAvailableDevice } from "@/lib/api/types";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type SortField = "assetName" | "deviceName";
type SortDirection = "asc" | "desc";

const AssetManagement = () => {
  const {
    assets,
    availableDevices,
    isLoading,
    isError,
    error,
    createAsset,
    updateAsset,
    deleteAsset,
    configureAssetWithDevice,
    bulkDeleteAssets,
    isCreating,
    isUpdating,
    isDeleting,
    isConfiguring,
    isBulkDeleting,
    refetch,
    refetchAvailableDevices,
  } = useAssets();

  const [searchTerm, setSearchTerm] = useState("");
  const [configuredFilter, setConfiguredFilter] = useState<"all" | "configured" | "unlinked">("all");
  const [sortField, setSortField] = useState<SortField>("assetName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ApiAsset | null>(null);
  const [configuringAsset, setConfiguringAsset] = useState<ApiAsset | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    assetName: "",
  });

  // Filter and sort assets
  const filteredAssets = assets
    .filter((asset) => {
      const matchesSearch =
        asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesFilter = 
        configuredFilter === "all" ||
        (configuredFilter === "configured" && asset.deviceId !== null) ||
        (configuredFilter === "unlinked" && asset.deviceId === null);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "assetName":
          comparison = a.assetName.localeCompare(b.assetName);
          break;
        case "deviceName":
          comparison = (a.deviceName || "").localeCompare(b.deviceName || "");
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
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
      setSelectedAssets(paginatedAssets.map((a) => a.id));
    } else {
      setSelectedAssets([]);
    }
  };

  const handleSelectAsset = (assetId: number, checked: boolean) => {
    if (checked) {
      setSelectedAssets([...selectedAssets, assetId]);
    } else {
      setSelectedAssets(selectedAssets.filter((id) => id !== assetId));
    }
  };

  const handleCreateAsset = () => {
    setEditingAsset(null);
    setFormData({ assetName: "" });
    setIsDialogOpen(true);
  };

  const handleEditAsset = (asset: ApiAsset) => {
    setEditingAsset(asset);
    setFormData({ assetName: asset.assetName });
    setIsDialogOpen(true);
  };

  const handleSaveAsset = () => {
    if (!formData.assetName.trim()) {
      return;
    }

    if (editingAsset) {
      updateAsset({
        id: editingAsset.id,
        data: { assetName: formData.assetName },
      });
    } else {
      createAsset({ assetName: formData.assetName });
    }
    setIsDialogOpen(false);
  };

  const handleDeleteAsset = (assetId: number) => {
    deleteAsset(assetId);
    setSelectedAssets(selectedAssets.filter((id) => id !== assetId));
  };

  const handleBulkDelete = () => {
    bulkDeleteAssets(selectedAssets);
    setSelectedAssets([]);
  };

  const handleOpenConfigureDialog = (asset: ApiAsset) => {
    setConfiguringAsset(asset);
    setSelectedDeviceId("");
    refetchAvailableDevices();
    setIsConfigureDialogOpen(true);
  };

  const handleConfigureAsset = () => {
    if (!configuringAsset || !selectedDeviceId) return;
    
    configureAssetWithDevice({
      assetId: configuringAsset.id,
      deviceId: parseInt(selectedDeviceId),
    });
    setIsConfigureDialogOpen(false);
    setConfiguringAsset(null);
    setSelectedDeviceId("");
  };

  const exportToCSV = () => {
    const headers = ["ID", "Asset Name", "Device ID", "Device Name"];
    const rows = filteredAssets.map((a) => [
      a.id.toString(),
      a.assetName,
      a.deviceId?.toString() || "",
      a.deviceName || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assets.csv";
    a.click();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading assets...</p>
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
          <AlertTitle>Error loading assets</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load assets. Please try again."}
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
          <h1 className="text-3xl font-bold text-foreground">Asset Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and configure assets with devices.
          </p>
        </div>
        <Button onClick={handleCreateAsset} className="gap-2" disabled={isCreating}>
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add Asset
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
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
                variant={configuredFilter === "unlinked" ? "default" : "outline"}
                size="sm"
                onClick={() => setConfiguredFilter("unlinked")}
              >
                Unlinked
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
      {selectedAssets.length > 0 && (
        <Card className="border-primary">
          <CardContent className="p-4 flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">
              {selectedAssets.length} selected
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

      {/* Assets Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      paginatedAssets.length > 0 &&
                      paginatedAssets.every((a) => selectedAssets.includes(a.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("assetName")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Asset Name
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("deviceName")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Linked Device
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm || configuredFilter !== "all" 
                      ? "No assets match your filters" 
                      : "No assets found. Click 'Add Asset' to create one."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAssets.includes(asset.id)}
                        onCheckedChange={(checked) =>
                          handleSelectAsset(asset.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      #{asset.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="font-medium">{asset.assetName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {asset.deviceName ? (
                        <div className="flex items-center gap-2">
                          <Link className="h-3 w-3 text-muted-foreground" />
                          <span>{asset.deviceName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          asset.deviceId
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                        }
                      >
                        {asset.deviceId ? "Configured" : "Unlinked"}
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
                          <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!asset.deviceId && (
                            <DropdownMenuItem onClick={() => handleOpenConfigureDialog(asset)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Configure with Device
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteAsset(asset.id)}
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
            {Math.min(currentPage * itemsPerPage, filteredAssets.length)} of{" "}
            {filteredAssets.length} assets
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
              {editingAsset ? "Edit Asset" : "Add New Asset"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assetName">
                Asset Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="assetName"
                value={formData.assetName}
                onChange={(e) =>
                  setFormData({ ...formData, assetName: e.target.value })
                }
                placeholder="Enter asset name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAsset} 
              disabled={!formData.assetName.trim() || isCreating || isUpdating}
            >
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingAsset ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Asset Dialog */}
      <Dialog open={isConfigureDialogOpen} onOpenChange={setIsConfigureDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Asset with Device</DialogTitle>
            <DialogDescription>
              Link "{configuringAsset?.assetName}" to an available device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deviceSelect">Select Device</Label>
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a device..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDevices.length === 0 ? (
                    <SelectItem value="" disabled>
                      No available devices
                    </SelectItem>
                  ) : (
                    availableDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id.toString()}>
                        {device.deviceName} - {device.description}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {availableDevices.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  All devices are already configured with assets.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigureDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfigureAsset} 
              disabled={!selectedDeviceId || isConfiguring}
            >
              {isConfiguring && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Configure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetManagement;
