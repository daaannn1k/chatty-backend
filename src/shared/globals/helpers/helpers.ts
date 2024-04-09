/* eslint-disable @typescript-eslint/no-explicit-any */
export class Helpers {
  static firstLetterUppercase(str: string): string {
    const valueString = str.toLowerCase();

    return valueString
      .split('')
      .map((letter, index) => {
        if (index === 0) return letter.toUpperCase();
        return letter;
      })
      .join('');
  }

  static lowerCase(str: string): string {
    return str.toLowerCase();
  }

  static generateRandomIntegers(integerLength: number): number {
    const characters = '01234567890';
    let result = ' ';
    const charactersLength = characters.length;

    for (let i = 0; i < integerLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return parseInt(result, 10);
  }

  static parseJson(prop: string): any {
    try {
      return JSON.parse(prop);
    } catch (error) {
      return prop;
    }
  }

  static formatObject(obj: any): any {
    return Object.entries(obj).reduce((acc: any, item: any[]) => {
      const parsed: any = this.parseJson(item[1]);
      acc[item[0]] = parsed;
      return acc;
    }, {} as any);
  }

  static isDataURL(value: string): boolean {
    const dataURLRegex = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\\/?%\s]*)\s*$/i;
    return dataURLRegex.test(value);
  }
}
