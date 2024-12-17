/**
 * Return an object containing all values of types string, boolean, number from the input
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSimpleValues(input:any):Record<string, string | number | boolean>{
    if(!input){
        return {}
    }
    const result = {}
    Object.keys(input).forEach((key)=>{
        if((typeof input[key] === "string") || (typeof input[key] === "boolean") || (typeof input[key] === "number") ){
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (result as any)[key] = input[key]
        }
    })
    return result
}

type InputObject = Record<string, Record<string, unknown>>;
type ResultItem<T> = T & { name: string };

/**
 * Transforms an object or array into an array of objects with a 'name' property.
 *
 * @typeParam T - The input type, which can be an object or an array
 *
 * @param {T} input - The input to be transformed
 * @returns {T extends unknown[] ? T : ResultItem<T[keyof T]>[]}
 * - If input is an array, returns the original array
 * - If input is an object, returns an array of objects with 'name' property
 *
 * @throws {Error} If any value in the input object is not an object
 *
 * @remarks
 * It's mostly used in context like turning networks or volumes in array as in docker compose theses can be represented as :
 * ```yaml
 * networks:
 *  - network1
 *  - netowrk2
 * ```
 *
 * or
 *```yaml
 * networks:
 *  network1:
 *  netowrk2:
 * ```
 *
 * This function serves two primary purposes:
 * 1. Passes through arrays unchanged
 * 2. Converts objects into an array of objects where:
 *    - Each array item includes the original key as a 'name' property
 *    - The original object's properties are spread into the new object
 **/
export function turnObjectInArrayWithName<T extends InputObject | unknown[]>(
    input: T
): T extends unknown[] ? T : ResultItem<T[keyof T]>[] {
    if (Array.isArray(input)) {
        return input as T extends unknown[] ? T : ResultItem<T[keyof T]>[];
    }

    const result: ResultItem<T[keyof T]>[] = [];
    Object.keys(input).forEach((key) => {
        const value = (input as InputObject)[key];
        if (typeof value === "object" && value !== null) {
            result.push({
                name: key,
                ...value,
            } as ResultItem<T[keyof T]>);
        } else {
            throw new Error(`Value at key "${key}" is not an object and cannot be spread.`);
        }
    });

    return result as T extends unknown[] ? T : ResultItem<T[keyof T]>[];
}