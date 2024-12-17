/**
 * An extended Set class with additional utility methods.
 *
 * @typeParam T - The type of elements in the SuperSet
 *
 * @remarks
 * SuperSet enhances the standard JavaScript Set with additional methods like
 * retrieving items by property, mapping, and custom JSON serialization.
 *
 * @example
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   age: number;
 * }
 *
 * const users = new SuperSet<User>();
 * users.add({ id: 1, name: 'John', age: 30 });
 * users.add({ id: 2, name: 'Jane', age: 25 });
 *
 * // Get a user by a specific property
 * const john = users.get('name', 'John');
 *
 * // Map users to their names
 * const userNames = users.map(user => user.name);
 * ```
 */
export class SuperSet<T> extends Set<T> {
    /**
     * Retrieves an item from the set based on a specific property and its value.
     *
     * @typeParam C - The key type of the property to search by
     *
     * @param {C} key - The property key to search for
     * @param {T[C]} value - The value to match against the specified property
     *
     * @returns {T | undefined} The first item matching the criteria, or undefined if no match is found
     *
     * @example
     * ```typescript
     * const users = new SuperSet<User>();
     * const user = users.get('id', 1); // Returns the user with id 1
     * ```
     */
    get<C extends keyof T>(key: C, value: T[C]): T | undefined {
        for (const item of this) {
            if (item[key] === value) {
                return item;
            }
        }
        return undefined;
    }

    /**
     * Transforms the set by applying a callback function to each item.
     *
     * @typeParam U - The return type of the transformation
     *
     * @param {(item: T) => U} callback - A function to transform each item
     *
     * @returns {U[]} An array of transformed items
     *
     * @example
     * ```typescript
     * const numbers = new SuperSet([1, 2, 3]);
     * const squared = numbers.map(x => x * x); // [1, 4, 9]
     * ```
     */
    map<U>(callback: (item: T) => U): U[] {
        const result: U[] = [];
        for (const item of this) {
            result.push(callback(item));
        }
        return result;
    }

    /**
     * Converts the SuperSet to a JSON-serializable array.
     *
     * @returns {T[]} An array representation of the set's items
     *
     * @example
     * ```typescript
     * const set = new SuperSet([1, 2, 3]);
     * const jsonArray = set.toJSON(); // [1, 2, 3]
     * ```
     */
    toJSON(): T[] {
        return Array.from(this);
    }
}