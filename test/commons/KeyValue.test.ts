import { KeyValue } from "../../";

test("KeyValue complete", () => {
    const keyValue: KeyValue = new KeyValue("network", "normal");
    expect(keyValue.key).toBe("network");
    expect(keyValue.value).toBe("normal");
    expect(keyValue.toString()).toBe("network=normal");
});

test("KeyValue complete", () => {
    const keyValue: KeyValue = new KeyValue("network");
    expect(keyValue.key).toBe("network");
    expect(keyValue.value).toBe(undefined);
    expect(keyValue.toString()).toBe('network=""');
});

test("KeyValue prefix", () => {
    const keyValue: KeyValue = new KeyValue("network","lala","lab_");
    expect(keyValue.id.substring(0, 4)).toBe("lab_")
});
