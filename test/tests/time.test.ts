import Time from '../../src/time';

describe('Time.toEpoch()', () => {
    test('Returns correctly', () => {
        const now = new Date();

        expect(Time.toEpoch(now)).toBe(now.getTime());
    });
});

describe('Time.epochToDate()', () => {
    test('Returns correctly', () => {
        const now = new Date();

        expect(Time.epochToDate(now.getTime())).toStrictEqual(now);
    });
});
