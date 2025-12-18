declare module 'fernet' {
  export class Token {
    constructor(options: { secret: string; time?: Date; iv?: Buffer; ttl?: number })
    encode(message: string): string
    decode(token: string): Buffer
    static generate(secret: string): string
  }

  export class Secret {
    constructor(secret: string)
    encode(data: string): string
    decode(token: string): string
  }
}
