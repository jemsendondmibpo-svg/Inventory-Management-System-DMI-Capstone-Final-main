import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

// Inventory Context for managing inventory assets with Supabase integration
export interface InventoryAsset {
  id: string;
  assetName: string;
  sku: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock";
  assetStatus: "Available" | "Assigned" | "Under Maintenance" | "Defective";
  brand: string;
  model: string;
  serialNumber: string;
  condition: string;
  purchaseDate: string;
  createdAt?: string;
  updatedAt?: string;
  location: string;
  locationCode: string;
}

interface InventoryContextType {
  inventory: InventoryAsset[];
  addAsset: (asset: Omit<InventoryAsset, 'id'>) => Promise<void>;
  updateAsset: (asset: InventoryAsset) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  getAsset: (id: string) => InventoryAsset | undefined;
  loading: boolean;
  error: string | null;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<InventoryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();

    // Set up real-time subscription for inventory updates
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'assets',
        },
        (payload) => {
          console.log('Real-time inventory change detected:', payload);
          // Refresh inventory when any change occurs
          fetchInventory();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        const mappedInventory: InventoryAsset[] = data.map((item: any) => {
          // Calculate stock status
          let stockStatus: "In Stock" | "Low Stock" | "Out of Stock" = "In Stock";
          if (item.quantity === 0) {
            stockStatus = "Out of Stock";
          } else if (item.quantity <= item.min_quantity) {
            stockStatus = "Low Stock";
          }

          return {
            id: item.asset_id,
            assetName: item.asset_name,
            sku: item.sku,
            category: item.asset_type,
            quantity: item.quantity || 0,
            minQuantity: item.min_quantity || 0,
            price: item.price || 0,
            stockStatus: stockStatus,
            assetStatus:
              item.status === "Available"
                ? "Available"
                : item.status === "Assigned"
                  ? "Assigned"
                  : item.status === "Under Maintenance"
                    ? "Under Maintenance"
                    : "Defective",
            brand: item.brand || '',
            model: item.model || '',
            serialNumber: item.serial_number || '',
            condition: item.condition || '',
            purchaseDate: item.purchase_date || '',
            createdAt: item.created_at || '',
            updatedAt: item.updated_at || '',
            location: item.location || '',
            locationCode: item.location_code || '',
          };
        });

        setInventory(mappedInventory);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const addAsset = async (asset: Omit<InventoryAsset, 'id'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('assets')
        .insert([
          {
            asset_name: asset.assetName,
            sku: asset.sku,
            asset_type: asset.category,
            brand: asset.brand,
            model: asset.model,
            serial_number: asset.serialNumber,
            status: asset.assetStatus,
            condition: asset.condition,
            purchase_date: asset.purchaseDate,
            price: asset.price,
            quantity: asset.quantity,
            min_quantity: asset.minQuantity,
            location: asset.location,
            location_code: asset.locationCode,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Refresh inventory
      await fetchInventory();
      toast.success('Asset added successfully');
    } catch (err) {
      console.error('Error adding asset:', err);
      toast.error('Failed to add asset');
      throw err;
    }
  };

  const updateAsset = async (asset: InventoryAsset) => {
    try {
      const { error: updateError } = await supabase
        .from('assets')
        .update({
          asset_name: asset.assetName,
          sku: asset.sku,
          asset_type: asset.category,
          brand: asset.brand,
          model: asset.model,
          serial_number: asset.serialNumber,
          status: asset.assetStatus,
          condition: asset.condition,
          purchase_date: asset.purchaseDate,
          price: asset.price,
          quantity: asset.quantity,
          min_quantity: asset.minQuantity,
          location: asset.location,
          location_code: asset.locationCode,
        })
        .eq('asset_id', asset.id);

      if (updateError) throw updateError;

      // Refresh inventory
      await fetchInventory();
      toast.success('Asset updated successfully');
    } catch (err) {
      console.error('Error updating asset:', err);
      toast.error('Failed to update asset');
      throw err;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('assets')
        .delete()
        .eq('asset_id', id);

      if (deleteError) throw deleteError;

      // Refresh inventory
      await fetchInventory();
      toast.success('Asset deleted successfully');
    } catch (err) {
      console.error('Error deleting asset:', err);
      toast.error('Failed to delete asset');
      throw err;
    }
  };

  const getAsset = (id: string) => inventory.find((x) => x.id === id);

  return (
    <InventoryContext.Provider value={{ inventory, addAsset, updateAsset, deleteAsset, getAsset, loading, error }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
