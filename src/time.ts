export default class Time {
    public static toEpoch(date: Date): number {
        return date.getTime();
    }
}
