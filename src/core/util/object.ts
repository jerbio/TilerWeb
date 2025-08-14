class ObjectUtil {
	static compareObjects<T>(obj1: T, obj2: T): boolean {
		return JSON.stringify(obj1) === JSON.stringify(obj2);
	}
} 

export default ObjectUtil;
