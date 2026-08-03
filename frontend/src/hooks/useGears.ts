import { useState } from "react";
import {
  createGear as createGearService,
  updateGear as updateGearService,
  deleteGear as deleteGearService,
  getMyGearById as getGearByIdService,
} from "@/services/gearService";
import type { Gear } from "@/types/catalog";

export function useGears() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGear = async (data: {
    categoryId?: string;
    name: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    description?: string;
    specifications?: Record<string, string>;
    value?: number;
    rentPricePerDay: number;
    idempotencyKey?: string;
    imageUrls?: string[];
  }): Promise<Gear> => {
    setLoading(true);
    setError(null);
    try {
      const gear = await createGearService(data);
      return gear;
    } catch (err: any) {
      const msg = err?.message || "Đã xảy ra lỗi khi tạo thiết bị.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const updateGear = async (
    id: string,
    data: {
      categoryId?: string;
      name?: string;
      brand?: string;
      model?: string;
      serialNumber?: string;
      description?: string;
      specifications?: Record<string, string>;
      value?: number;
      rentPricePerDay?: number;
      status?: "available" | "maintenance" | "delisted" | "rented";
      imageUrls?: string[];
    }
  ): Promise<Gear> => {
    setLoading(true);
    setError(null);
    try {
      const gear = await updateGearService(id, data);
      return gear;
    } catch (err: any) {
      const msg = err?.message || "Đã xảy ra lỗi khi cập nhật thiết bị.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const softDelete = async (id: string): Promise<Gear> => {
    return updateGear(id, { status: "delisted" });
  };

  /** Recover a delisted gear back to available */
  const relist = async (id: string): Promise<Gear> => {
    return updateGear(id, { status: "available" });
  };

  const togglePause = async (id: string, currentStatus: string): Promise<Gear> => {
    const targetStatus =
      currentStatus === "paused" || currentStatus === "maintenance"
        ? "available"
        : "maintenance";
    return updateGear(id, { status: targetStatus });
  };

  const getGearById = async (id: string): Promise<Gear> => {
    setLoading(true);
    setError(null);
    try {
      const gear = await getGearByIdService(id);
      return gear;
    } catch (err: any) {
      const msg = err?.message || "Đã xảy ra lỗi khi tải thông tin thiết bị.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    createGear,
    updateGear,
    softDelete,
    relist,
    togglePause,
    getGearById,
    loading,
    error,
  };
}
