import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  MoreHorizontal,
  Package,
  FileText,
  HardDrive,
  Monitor as MonitorIcon,
  ArrowUpDown,
} from "lucide-react";
import { Asset, AssetCategory, AssetStatus } from "@/types";
import { mockAssets, mockUsers, mockDevices } from "@/data/mockData";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const categoryIcons: Record<AssetCategory, React.ElementType> = {
  hardware: HardDrive,
  software: FileText,
  peripheral: MonitorIcon,
  license: FileText,
  other: Package,
};

const statusColors: Record<AssetStatus, string> = {
  available: "bg-green-500/10 text-green-600 border-green-500/20",
  in_use: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  reserved: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  retired: "bg-red-500/10 text-red-600 border-red-500/20",
};

type SortField = "name" | "category" | "status" | "cost" | "lastUpdated";
type SortDirection = "asc" | "desc";

const AssetManagement = () => {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | "all">("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState<Partial<Asset>>({
    name: "",
    category: "hardware",
    status: "available",
    assetTag: "",
    linkedDeviceId: "",
    assignedUserId: "",
    cost: 0,
    expiryDate: "",
    notes: "",
  });

  const filteredAssets = assets
    .filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || asset.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "cost":
          comparison = a.cost - b.cost;
          break;
        case "lastUpdated":
          comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

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

  const handleSelectAsset = (assetId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssets([...selectedAssets, assetId]);
    } else {
      setSelectedAssets(selectedAssets.filter((id) => id !== assetId));
    }
  };

  const handleCreateAsset = () => {
    setEditingAsset(null);
    setFormData({
      name: "",
      category: "hardware",
      status: "available",
      assetTag: "",
      linkedDeviceId: "",
      assignedUserId: "",
      cost: 0,
      expiryDate: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      category: asset.category,
      status: asset.status,
      assetTag: asset.assetTag,
      linkedDeviceId: asset.linkedDeviceId || "",
      assignedUserId: asset.assignedUserId || "",
      cost: asset.cost,
      expiryDate: asset.expiryDate || "",
      notes: asset.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSaveAsset = () => {
    if (!formData.name || !formData.assetTag) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const assignedUser = mockUsers.find((u) => u.id === formData.assignedUserId);
    const linkedDevice = mockDevices.find((d) => d.id === formData.linkedDeviceId);

    if (editingAsset) {
      setAssets(
        assets.map((a) =>
          a.id === editingAsset.id
            ? {
                ...a,
                ...formData,
                assignedUserName: assignedUser?.username,
                linkedDeviceName: linkedDevice?.name,
                lastUpdated: new Date().toISOString(),
              }
            : a
        )
      );
      toast({
        title: "Asset Updated",
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      const newAsset: Asset = {
        id: `a${Date.now()}`,
        name: formData.name!,
        category: formData.category as AssetCategory,
        status: formData.status as AssetStatus,
        assetTag: formData.assetTag!,
        linkedDeviceId: formData.linkedDeviceId || undefined,
        linkedDeviceName: linkedDevice?.name,
        assignedUserId: formData.assignedUserId || undefined,
        assignedUserName: assignedUser?.username,
        purchaseDate: new Date().toISOString(),
        expiryDate: formData.expiryDate || undefined,
        cost: formData.cost || 0,
        lastUpdated: new Date().toISOString(),
        notes: formData.notes,
      };
      setAssets([...assets, newAsset]);
      toast({
        title: "Asset Created",
        description: `${formData.name} has been added successfully.`,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDeleteAsset = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    setAssets(assets.filter((a) => a.id !== assetId));
    setSelectedAssets(selectedAssets.filter((id) => id !== assetId));
    toast({
      title: "Asset Deleted",
      description: `${asset?.name} has been removed.`,
    });
  };

  const handleBulkDelete = () => {
    setAssets(assets.filter((a) => !selectedAssets.includes(a.id)));
    toast({
      title: "Assets Deleted",
      description: `${selectedAssets.length} assets have been removed.`,
    });
    setSelectedAssets([]);
  };

  const handleBulkStatusUpdate = (status: AssetStatus) => {
    setAssets(
      assets.map((a) =>
        selectedAssets.includes(a.id)
          ? { ...a, status, lastUpdated: new Date().toISOString() }
          : a
      )
    );
    toast({
      title: "Status Updated",
      description: `${selectedAssets.length} assets updated to ${status.replace("_", " ")}.`,
    });
    setSelectedAssets([]);
  };

  const exportToCSV = () => {
    const headers = ["Name", "Category", "Status", "Asset Tag", "Linked Device", "Assigned To", "Cost", "Last Updated"];
    const rows = filteredAssets.map((a) => [
      a.name,
      a.category,
      a.status,
      a.assetTag,
      a.linkedDeviceName || "",
      a.assignedUserName || "",
      a.cost.toFixed(2),
      format(new Date(a.lastUpdated), "yyyy-MM-dd HH:mm"),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assets.csv";
    a.click();
    toast({
      title: "Export Complete",
      description: "Assets exported to CSV successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Asset Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage hardware, software, and licenses.
          </p>
        </div>
        <Button onClick={handleCreateAsset} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Filters */}
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
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as AssetStatus | "all")}
            >
              <SelectTrigger className="w-full md:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in_use">In Use</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as AssetCategory | "all")}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="peripheral">Peripheral</SelectItem>
                <SelectItem value="license">License</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export
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
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate("available")}
            >
              Set Available
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate("in_use")}
            >
              Set In Use
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
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
                <TableHead>
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Asset
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("category")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Category
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Status
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>Linked Device</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("cost")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Cost
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAssets.map((asset) => {
                const Icon = categoryIcons[asset.category];
                return (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAssets.includes(asset.id)}
                        onCheckedChange={(checked) =>
                          handleSelectAsset(asset.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {asset.assetTag}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{asset.category}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[asset.status]}>
                        {asset.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {asset.linkedDeviceName || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {asset.assignedUserName || (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>${asset.cost.toFixed(2)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
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
                );
              })}
              {paginatedAssets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No assets found
                  </TableCell>
                </TableRow>
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
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
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter asset name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value as AssetCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="peripheral">Peripheral</SelectItem>
                    <SelectItem value="license">License</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as AssetStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_use">In Use</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetTag">Asset Tag *</Label>
              <Input
                id="assetTag"
                value={formData.assetTag}
                onChange={(e) =>
                  setFormData({ ...formData, assetTag: e.target.value })
                }
                placeholder="Enter asset tag"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedDevice">Linked Device</Label>
              <Select
                value={formData.linkedDeviceId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    linkedDeviceId: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {mockDevices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedUser">Assigned User</Label>
              <Select
                value={formData.assignedUserId || "unassigned"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    assignedUserId: value === "unassigned" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate ? formData.expiryDate.split("T")[0] : ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expiryDate: e.target.value ? new Date(e.target.value).toISOString() : "",
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsset}>
              {editingAsset ? "Save Changes" : "Add Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetManagement;
