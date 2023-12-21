import {
  AminoConverters,
  AminoTypes,
  SigningStargateClient,
} from "@cosmjs/stargate";
import { Decimal } from "@cosmjs/math";

class AminoUntyped extends AminoTypes {
  constructor(...args) {
    super(...args);
  }
  public toAmino({ typeUrl, value }: EncodeObject): AminoMsg {
    const converter = this.register[typeUrl];
    if (!converter) {
      throw new Error(
        `Type URL '${typeUrl}' does not exist in the Amino message type register. ` +
          "If you need support for this message type, you can pass in additional entries to the AminoTypes constructor. " +
          "If you think this message type should be included by default, please open an issue at https://github.com/cosmos/cosmjs/issues."
      );
    }
    if (!converter.aminoType) {
      return converter.toAmino(value);
    } else
      return {
        type: converter.aminoType,
        value: converter.toAmino(value),
      };
  }

  public fromAmino(untyped): EncodeObject {
    const matches = Object.entries(this.register).filter(
      ([_typeUrl, { aminoType }]) => !aminoType
    );
    console.log("DEBUG matches", matches);

    switch (matches.length) {
      case 0: {
        throw new Error("test");
        //   `Amino type identifier '${untyped}' does not exist in the Amino message type register. ` +
        //     "If you need support for this message type, you can pass in additional entries to the AminoTypes constructor. " +
        //     "If you think this message type should be included by default, please open an issue at https://github.com/cosmos/cosmjs/issues."
        // );
      }
      case 1: {
        const [typeUrl, converter] = matches[0];
        return {
          typeUrl: typeUrl,
          value: converter.fromAmino(untyped),
        };
      }
      default:
        throw new Error(
          `Multiple types are registered with Amino type identifier '${type}': '` +
            matches
              .map(([key, _value]) => key)
              .sort()
              .join("', '") +
            "'. Thus fromAmino cannot be performed."
        );
    }
  }
}

export const makeClient = (
  rpc,
  offlineSigner,
  converters: AminoConverters,
  accountParser,
  registry
) => {
  return SigningStargateClient.connectWithSigner(rpc, offlineSigner, {
    // @ts-expect-error version mismatch
    registry,
    gasPrice: {
      denom: "uist",
      // @ts-expect-error version mismatch
      amount: Decimal.fromUserInput("50000000", 0),
    },
    aminoTypes: new AminoUntyped(
      // Object.fromEntries(Object.entries(converters).flatMap(aminoFiltered))
      converters
    ),
    converters,
    accountParser,
  });
};
