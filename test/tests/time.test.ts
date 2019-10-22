import Time from '../../src/time';

describe('Time.toEpoch()', () => {
    test('Returns correctly', () => {
        const now = new Date();

        expect(Time.toEpoch(now)).toBe(now.getTime() / 1000);
    });
});

describe('Time.epochToDate()', () => {
    test('Returns correctly', () => {
        const now = new Date();

        expect(Time.epochToDate(now.getTime() / 1000)).toStrictEqual(now);
    });
});
