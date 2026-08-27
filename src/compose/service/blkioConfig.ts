import { ByteValue } from "@commons/units";

export type PathRate = {
    path: string;
    rate: ByteValue | number;
};

export type WeightDevice = {
    path: string;
    weight: number;
};

export type BlkioConfig = {
    weight?: number;
    weight_device?: WeightDevice[];
    device_read_bps?: PathRate[];
    device_write_bps?: PathRate[];
    device_read_iops?: PathRate[];
    device_write_iops?: PathRate[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPathRates(input: any, asBytes: boolean): PathRate[] | undefined {
    if (!Array.isArray(input)) {
        return undefined;
    }
    return input.map((entry) => ({
        path: String(entry?.path),
        // bps limits are byte sizes, iops limits are plain operation counts
        rate: asBytes ? ByteValue.fromString(entry?.rate) ?? Number(entry?.rate) : Number(entry?.rate),
    }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function blkioConfigFromDict(input: any): BlkioConfig | undefined {
    if (!input || typeof input !== "object") {
        return undefined;
    }
    return {
        weight: typeof input.weight === "number" ? input.weight : undefined,
        weight_device: Array.isArray(input.weight_device)
            ? input.weight_device.map((entry: { path: string; weight: number }) => ({
                  path: String(entry?.path),
                  weight: Number(entry?.weight),
              }))
            : undefined,
        device_read_bps: toPathRates(input.device_read_bps, true),
        device_write_bps: toPathRates(input.device_write_bps, true),
        device_read_iops: toPathRates(input.device_read_iops, false),
        device_write_iops: toPathRates(input.device_write_iops, false),
    };
}

export function blkioConfigToDict(config: BlkioConfig): object {
    const rates = (entries?: PathRate[]) =>
        entries?.map((entry) => ({ path: entry.path, rate: entry.rate.toString() }));
    const counts = (entries?: PathRate[]) => entries?.map((entry) => ({ path: entry.path, rate: Number(entry.rate) }));
    return {
        weight: config.weight,
        weight_device: config.weight_device,
        device_read_bps: rates(config.device_read_bps),
        device_write_bps: rates(config.device_write_bps),
        device_read_iops: counts(config.device_read_iops),
        device_write_iops: counts(config.device_write_iops),
    };
}
