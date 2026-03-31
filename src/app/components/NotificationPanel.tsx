import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, AlertTriangle, AlertCircle, PackageX, ChevronRight } from "lucide-react";
import { useInventory } from "../context/InventoryContext";
import { useNavigate } from "react-router";

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { inventory } = useInventory();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const lowStockItems = inventory.filter((item) => item.stockStatus === "Low Stock");
  const outOfStockItems = inventory.filter((item) => item.stockStatus === "Out of Stock");
  const damagedItems = inventory.filter(
    (item) => item.condition === "Damaged" || item.condition === "Poor"
  );

  const totalNotifications = lowStockItems.length + outOfStockItems.length + damagedItems.length;

  const handleViewInventory = () => {
    setIsOpen(false);
    navigate("/dashboard/inventory");
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-1.5 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-100 dark:hover:bg-[#132338] dark:hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {totalNotifications > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white dark:border-[#0d1a2b]">
            {totalNotifications > 99 ? "99+" : totalNotifications}
          </span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[9999] w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] ring-1 ring-black/5 dark:border-[#4b6587] dark:bg-[#0b1728] dark:shadow-[0_28px_80px_rgba(0,0,0,0.5)] dark:ring-white/10"
            style={{ top: `${position.top}px`, right: `${position.right}px` }}
          >
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#36506f] dark:bg-linear-to-r dark:from-[#13243a] dark:via-[#162b44] dark:to-[#102236]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Notifications</h3>
                <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-500 dark:border-[#4b6587] dark:bg-[#20324a] dark:text-slate-100">
                  {totalNotifications} alerts
                </span>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto bg-white dark:bg-[#0b1728]">
              {totalNotifications === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-[#1b3049]">
                    <Bell className="h-7 w-7 text-slate-400 dark:text-[#d7e25f]" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-50">No notifications</p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-300">All inventory items are in good condition</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-[#2d435e]">
                  {outOfStockItems.length > 0 && (
                    <div className="px-4 py-3 dark:bg-[#0f1d31]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15 dark:ring-1 dark:ring-red-400/25">
                          <PackageX className="h-4 w-4 text-red-700 dark:text-red-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                              Out of Stock
                            </h4>
                            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white shadow-sm dark:bg-red-500/90">
                              {outOfStockItems.length}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {outOfStockItems.slice(0, 3).map((item) => (
                              <p key={item.id} className="truncate text-xs text-gray-600 dark:text-slate-200">
                                • {item.assetName} ({item.sku})
                              </p>
                            ))}
                            {outOfStockItems.length > 3 && (
                              <p className="text-xs italic text-gray-400 dark:text-slate-400">
                                +{outOfStockItems.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {lowStockItems.length > 0 && (
                    <div className="px-4 py-3 dark:bg-[#0c1a2d]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/15 dark:ring-1 dark:ring-orange-400/25">
                          <AlertTriangle className="h-4 w-4 text-orange-700 dark:text-orange-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
                              Low Stock
                            </h4>
                            <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-xs font-bold text-white shadow-sm dark:bg-orange-500/90">
                              {lowStockItems.length}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {lowStockItems.slice(0, 3).map((item) => (
                              <p key={item.id} className="truncate text-xs text-gray-600 dark:text-slate-200">
                                • {item.assetName} - Qty: {item.quantity}/{item.minQuantity}
                              </p>
                            ))}
                            {lowStockItems.length > 3 && (
                              <p className="text-xs italic text-gray-400 dark:text-slate-400">
                                +{lowStockItems.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {damagedItems.length > 0 && (
                    <div className="px-4 py-3 dark:bg-[#0f1c2e]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-500/15 dark:ring-1 dark:ring-yellow-300/25">
                          <AlertCircle className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-yellow-700 dark:text-yellow-300">
                              Damaged Condition
                            </h4>
                            <span className="rounded-full bg-yellow-500 px-1.5 py-0.5 text-xs font-bold text-white shadow-sm dark:bg-yellow-500/90">
                              {damagedItems.length}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {damagedItems.slice(0, 3).map((item) => (
                              <p key={item.id} className="truncate text-xs text-gray-600 dark:text-slate-200">
                                • {item.assetName} - {item.condition}
                              </p>
                            ))}
                            {damagedItems.length > 3 && (
                              <p className="text-xs italic text-gray-400 dark:text-slate-400">
                                +{damagedItems.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {totalNotifications > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-[#36506f] dark:bg-[#13243a]">
                <button
                  onClick={handleViewInventory}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#B0BF00] px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(176,191,0,0.24)] transition-all hover:bg-[#9aaa00] dark:bg-[#d7e25f] dark:text-[#07111f] dark:hover:bg-[#c7d74a]"
                >
                  View Inventory
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
