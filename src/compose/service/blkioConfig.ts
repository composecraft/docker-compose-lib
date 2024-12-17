import { ByteUnits } from "@commons/units";

export type PathRate = {
    path: string;
    rate: ByteUnits;
};

export type BlkioConfig = {
    weight: number;
    weight_device: {
        path: string;
        weight: number;
    };
    device_read_bps: PathRate;
    device_write_bps: PathRate;
    device_read_iops: PathRate;
    device_write_iops: PathRate;
};
