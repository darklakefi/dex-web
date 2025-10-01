export const IDL_JSON = {
  accounts: [
    {
      discriminator: [218, 244, 33, 104, 203, 203, 43, 111],
      name: "AmmConfig",
    },
    {
      discriminator: [134, 173, 223, 185, 77, 86, 28, 51],
      name: "Order",
    },
    {
      discriminator: [241, 154, 109, 4, 17, 177, 109, 188],
      name: "Pool",
    },
  ],
  address: "darkr3FB87qAZmgLwKov6Hk9Yiah5UT4rUYu8Zhthw1",
  docs: [
    "# Darklake DEX - Two-Step Confidential Trading Protocol",
    "",
    "Darklake implements a decentralized exchange with blind slippage transactions using a two-step trading process.",
    "This design ensures privacy while maintaining economic security through time-bound commitments and zero-knowledge proofs.",
    "",
    "## Trading Flow Overview",
    "",
    "### Step 1: Swap (Resource Reservation)",
    "Each trade begins with a `swap` instruction that:",
    "- Reserves pool resources for the trade",
    "- Locks the user's input tokens in the pool",
    "- Requires a WSOL deposit as economic security",
    "- Creates a commitment to the minimum output amount using circom compatible [Poseidon hash](https://www.npmjs.com/package/circomlibjs/v/0.1.7)",
    "",
    "The commitment is a Poseidon hash of the minimum output amount with a random salt.",
    "This commitment preserves privacy while allowing later verification of trade conditions.",
    "",
    "### Step 2: Finalization (Settle/Cancel/Slash)",
    "After the swap, the trade must be finalized within a deadline using one of three methods:",
    "",
    "#### Settle (Success Path)",
    "- Called when minimum output (groth16 proof) and deadline are satisfied. Proof is generated using [snarkjs](https://github.com/darklakefi/snarkjs).",
    "- Pool takes the locked input tokens",
    "- User receives output tokens and WSOL deposit back",
    "- Pool releases locked reserves",
    "",
    "#### Cancel (Failure Path)",
    "- Called when minimum output requirement is violated (groth16) and deadline is satisfied",
    "- User receives original locked tokens back plus WSOL deposit",
    "- Pool releases locked reserves",
    "",
    "#### Slash (Timeout Path)",
    "- Called when deadline has passed without finalization (cancel or settle)",
    "- Caller receives the trader's WSOL deposit as reward",
    "- Original locked tokens are returned to the trader",
    "- Pool releases locked reserves",
    "",
    "## Zero-Knowledge Proofs",
    "",
    "Both `settle` and `cancel` require Groth16 zero-knowledge proofs to verify. Settle circuit proves",
    "minimum output was below the output, while cancel circuit proves minimum output was above the output.",
    "",
    "## Access Control",
    "",
    "- `settle`/`cancel`/`slash` can be called by anyone, and if necessary can generate the required proofs",
    "- Economic incentives ensure proper behavior (WSOL deposits and rewards)",
    "",
    "## Example Usage (TypeScript)",
    "",
    "```typescript",
    "import { Connection, PublicKey } from '@solana/web3.js';",
    "import { Program, AnchorProvider } from '@coral-xyz/anchor';",
    "import { poseidon } from 'circomlibjs';",
    "import { groth16 } from 'snarkjs';",
    "",
    "// Swap: Reserve resources and lock tokens",
    "const poseidon = await circomlibjs.buildPoseidon();",
    "",
    "// Poseidon expects inputs as BigInts",
    "const inputs = [bigInt(minOut), bigInt(salt)];",
    "",
    "// Generate the Poseidon commitment",
    "const minOutCommitment = poseidon(inputs);",
    "await program.methods",
    ".swap(amountIn, isSwapXToY, minOutCommitment)",
    ".accounts({ /* accounts */ })",
    ".rpc();",
    "",
    "// Settle: Complete successful trade with ZK proof",
    "const proof = await groth16.fullProve(inputs, wasmPath, zkeyPath);",
    "await program.methods",
    ".settle(proof.proof.a, proof.proof.b, proof.proof.c, publicInputs)",
    ".accounts({ /* accounts */ })",
    ".rpc();",
    "```",
  ],
  errors: [
    {
      code: 6000,
      msg: "Invalid input",
      name: "InvalidInput",
    },
    {
      code: 6001,
      msg: "Invalid proof",
      name: "InvalidProof",
    },
    {
      code: 6002,
      msg: "Invalid token mint",
      name: "InvalidTokenMint",
    },
    {
      code: 6003,
      msg: "Invalid deposit, too few tokens",
      name: "TooFewTokensSupplied",
    },
    {
      code: 6004,
      msg: "Pool received X or Y token quantity is 0",
      name: "ReceivedZeroTokens",
    },
    {
      code: 6005,
      msg: "Slippage tolerance exceeded",
      name: "SlippageExceeded",
    },
    {
      code: 6006,
      msg: "Math overflow",
      name: "MathOverflow",
    },
    {
      code: 6007,
      msg: "Math underflow",
      name: "MathUnderflow",
    },
    {
      code: 6008,
      msg: "Unable to create Groth16Verifier",
      name: "InvalidGroth16Verifier",
    },
    {
      code: 6009,
      msg: "Invalid token order",
      name: "InvalidTokenOrder",
    },
    {
      code: 6010,
      msg: "Invalid swap amount",
      name: "InvalidSwapAmount",
    },
    {
      code: 6011,
      msg: "Invalid LP mint",
      name: "InvalidLpMint",
    },
    {
      code: 6012,
      msg: "Invalid metadata account",
      name: "InvalidMetadataAccount",
    },
    {
      code: 6013,
      msg: "Pool reserve and public signals mismatch",
      name: "PublicSignalAndPoolReserveMismatch",
    },
    {
      code: 6014,
      msg: "Proof input not equal to pool input",
      name: "PoolInputAmountMismatch",
    },
    {
      code: 6015,
      msg: "Proof amount received exceeds pool output",
      name: "PoolOutputAmountTooLow",
    },
    {
      code: 6016,
      msg: "Unable to parse public signals",
      name: "InvalidPublicSignals",
    },
    {
      code: 6017,
      msg: "LP mint already initialized",
      name: "LpMintAlreadyInitialized",
    },
    {
      code: 6018,
      msg: "Liquidity too low",
      name: "LiquidityTooLow",
    },
    {
      code: 6019,
      msg: "Invalid transfer calculation",
      name: "TransferFeeCalculateNotMatch",
    },
    {
      code: 6020,
      msg: "Config is already initialized",
      name: "ConfigAlreadyExists",
    },
    {
      code: 6021,
      msg: "Invalid admin address",
      name: "InvalidAdmin",
    },
    {
      code: 6022,
      msg: "Insufficient SOL balance for WSOL deposit",
      name: "InsufficientSolBalance",
    },
    {
      code: 6023,
      msg: "Order expired",
      name: "OrderExpired",
    },
    {
      code: 6024,
      msg: "Order still valid",
      name: "OrderStillValid",
    },
    {
      code: 6025,
      msg: "AMM is halted",
      name: "AmmHalted",
    },
    {
      code: 6026,
      msg: "Order data doesn't match",
      name: "OrderDataMismatch",
    },
    {
      code: 6027,
      msg: "Order already exists",
      name: "OrderAlreadyExists",
    },
    {
      code: 6028,
      msg: "Liquidity tokens did not yield any pair tokens",
      name: "ZeroTokenOutput",
    },
    {
      code: 6029,
      msg: "Output is zero",
      name: "OutputIsZero",
    },
    {
      code: 6030,
      msg: "Invalid associated token program",
      name: "InvalidAssociatedTokenProgram",
    },
    {
      code: 6031,
      msg: "User token account X is uninitialized",
      name: "UserTokenAccountXUninitialized",
    },
    {
      code: 6032,
      msg: "User token account Y is uninitialized",
      name: "UserTokenAccountYUninitialized",
    },
    {
      code: 6033,
      msg: "Caller token account WSOL is uninitialized",
      name: "CallerTokenAccountWSolUninitialized",
    },
  ],
  events: [
    {
      discriminator: [31, 94, 125, 90, 227, 52, 61, 186],
      name: "AddLiquidity",
    },
    {
      discriminator: [196, 40, 17, 225, 87, 58, 126, 44],
      name: "Cancel",
    },
    {
      discriminator: [145, 104, 208, 79, 8, 159, 145, 240],
      name: "InitializePool",
    },
    {
      discriminator: [116, 244, 97, 232, 103, 31, 152, 58],
      name: "RemoveLiquidity",
    },
    {
      discriminator: [172, 88, 86, 73, 227, 209, 204, 56],
      name: "Settle",
    },
    {
      discriminator: [157, 91, 23, 33, 129, 182, 68, 120],
      name: "Slash",
    },
    {
      discriminator: [81, 108, 227, 190, 205, 208, 10, 196],
      name: "Swap",
    },
  ],
  instructions: [
    {
      accounts: [
        {
          name: "user",
          signer: true,
          writable: true,
        },
        {
          name: "token_mint_x",
        },
        {
          name: "token_mint_y",
        },
        {
          name: "token_mint_lp",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [108, 112],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
          writable: true,
        },
        {
          name: "pool",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "amm_config",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "amm_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 109, 109, 95, 99, 111, 110, 102, 105, 103],
              },
              {
                kind: "const",
                value: [0, 0, 0, 0],
              },
            ],
          },
        },
        {
          name: "authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121],
              },
            ],
          },
        },
        {
          name: "user_token_account_x",
          pda: {
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
            seeds: [
              {
                kind: "account",
                path: "user",
              },
              {
                kind: "account",
                path: "token_mint_x_program",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
            ],
          },
          writable: true,
        },
        {
          name: "user_token_account_y",
          pda: {
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
            seeds: [
              {
                kind: "account",
                path: "user",
              },
              {
                kind: "account",
                path: "token_mint_y_program",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "user_token_account_lp",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "user",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "token_mint_lp",
              },
            ],
          },
          writable: true,
        },
        {
          name: "pool_token_reserve_x",
          writable: true,
        },
        {
          name: "pool_token_reserve_y",
          writable: true,
        },
        {
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
          name: "associated_token_program",
        },
        {
          address: "11111111111111111111111111111111",
          name: "system_program",
        },
        {
          name: "token_mint_x_program",
        },
        {
          name: "token_mint_y_program",
        },
        {
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          name: "token_program",
        },
      ],
      args: [
        {
          name: "amount_lp",
          type: "u64",
        },
        {
          name: "max_amount_x",
          type: "u64",
        },
        {
          name: "max_amount_y",
          type: "u64",
        },
        {
          name: "ref_code",
          type: {
            option: {
              array: ["u8", 20],
            },
          },
        },
        {
          name: "label",
          type: {
            option: {
              array: ["u8", 21],
            },
          },
        },
      ],
      discriminator: [181, 157, 89, 67, 143, 182, 52, 72],
      docs: [
        "# Add Liquidity",
        "Adds liquidity to an existing pool.",
        "",
        "This function allows users to provide additional liquidity to an existing pool.",
        "The user specifies the desired amount of LP tokens to receive and maximum amounts",
        "of tokens they are willing to provide. The actual amounts will be calculated based",
        "on the current pool state and price.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing all required accounts for adding liquidity",
        "* `amount_lp` - The desired amount of LP tokens to receive",
        "* `max_amount_x` - The maximum amount of token X the user is willing to provide",
        "* `max_amount_y` - The maximum amount of token Y the user is willing to provide",
        "",
        "# Returns",
        "",
        "Returns `Ok(())` on successful liquidity addition, or an error if the operation fails.",
        "",
        "# Errors",
        "",
        "This function will return an error if:",
        "- The pool does not exist or is not properly initialized",
        "- The user does not have sufficient token balances",
        "- The calculated amounts exceed the maximum amounts specified",
        "- The liquidity addition would result in an invalid pool state",
      ],
      name: "add_liquidity",
    },
    {
      accounts: [
        {
          name: "caller",
          signer: true,
          writable: true,
        },
        {
          name: "order_owner",
          writable: true,
        },
        {
          name: "token_mint_x",
        },
        {
          name: "token_mint_y",
        },
        {
          name: "token_mint_wsol",
        },
        {
          name: "pool",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "amm_config",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121],
              },
            ],
          },
        },
        {
          name: "pool_token_reserve_x",
          writable: true,
        },
        {
          name: "pool_token_reserve_y",
          writable: true,
        },
        {
          name: "pool_wsol_reserve",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  112, 111, 111, 108, 95, 119, 115, 111, 108, 95, 114, 101, 115,
                  101, 114, 118, 101,
                ],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
          writable: true,
        },
        {
          name: "amm_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 109, 109, 95, 99, 111, 110, 102, 105, 103],
              },
              {
                kind: "const",
                value: [0, 0, 0, 0],
              },
            ],
          },
        },
        {
          name: "user_token_account_x",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "order_owner",
              },
              {
                kind: "account",
                path: "token_mint_x_program",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
            ],
          },
          writable: true,
        },
        {
          name: "user_token_account_y",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "order_owner",
              },
              {
                kind: "account",
                path: "token_mint_y_program",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "user_token_account_wsol",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "order_owner",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "token_mint_wsol",
              },
            ],
          },
          writable: true,
        },
        {
          name: "caller_token_account_wsol",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "caller",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "token_mint_wsol",
              },
            ],
          },
          writable: true,
        },
        {
          name: "order",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [111, 114, 100, 101, 114],
              },
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "account",
                path: "order_owner",
              },
            ],
          },
          writable: true,
        },
        {
          address: "11111111111111111111111111111111",
          name: "system_program",
        },
        {
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
          name: "associated_token_program",
        },
        {
          name: "token_mint_x_program",
        },
        {
          name: "token_mint_y_program",
        },
        {
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          name: "token_program",
        },
      ],
      args: [
        {
          name: "proof_a",
          type: {
            array: ["u8", 64],
          },
        },
        {
          name: "proof_b",
          type: {
            array: ["u8", 128],
          },
        },
        {
          name: "proof_c",
          type: {
            array: ["u8", 64],
          },
        },
        {
          name: "public_inputs",
          type: {
            array: [
              {
                array: ["u8", 32],
              },
              2,
            ],
          },
        },
        {
          name: "label",
          type: {
            option: {
              array: ["u8", 21],
            },
          },
        },
      ],
      discriminator: [232, 219, 223, 41, 219, 236, 220, 190],
      docs: [
        "# Cancel",
        "Cancels a confidential swap using zero-knowledge proof verification.",
        "",
        "This function allows users to cancel a previously initiated swap by providing a",
        "zero-knowledge (groth16) proof that demonstrates the cancellation is valid. This maintains",
        "privacy while ensuring only legitimate cancellations are processed.",
        "",
        "Groth16 proof is generated using [snarkjs](https://github.com/darklakefi/snarkjs).",
        "Curve: bn128, wasm and final zkey files are contained within this repo cancel-circuits.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing all required accounts for cancellation",
        "* `proof_a` - The first component of the Groth16 zero-knowledge proof (64 bytes)",
        "* `proof_b` - The second component of the Groth16 zero-knowledge proof (128 bytes)",
        "* `proof_c` - The third component of the Groth16 zero-knowledge proof (64 bytes)",
        "* `public_inputs` - Array of two 32-byte public inputs for the proof verification",
        "It contains real output amount and the commitment to the minimum output amount, made during the swap.",
        "",
        "# Returns",
        "",
        "Returns `Ok(())` on successful cancellation, or an error if the operation fails.",
        "",
        "# Errors",
        "",
        "This function will return an error if:",
        "- The zero-knowledge proof verification fails",
        "- The public inputs are invalid or inconsistent",
        "- The swap has already been settled or cancelled",
        "- The cancellation deadline has passed",
        "- The cancellation would violate pool invariants",
      ],
      name: "cancel",
    },
    {
      accounts: [
        {
          docs: ["Only admin or owner can collect fee now"],
          name: "admin",
          signer: true,
        },
        {
          name: "authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121],
              },
            ],
          },
        },
        {
          docs: ["Pool state stores accumulated protocol fee amount"],
          name: "pool",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "amm_config",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          docs: ["Amm config account stores owner"],
          name: "amm_config",
        },
        {
          docs: ["The address that holds pool tokens for token_x"],
          name: "pool_token_reserve_x",
          writable: true,
        },
        {
          docs: ["The address that holds pool tokens for token_y"],
          name: "pool_token_reserve_y",
          writable: true,
        },
        {
          docs: ["The mint of token_x vault"],
          name: "token_mint_x",
        },
        {
          docs: ["The mint of token_y vault"],
          name: "token_mint_y",
        },
        {
          docs: [
            "The address that receives the collected token_x protocol fees",
          ],
          name: "to_token_x",
          writable: true,
        },
        {
          docs: [
            "The address that receives the collected token_y protocol fees",
          ],
          name: "to_token_y",
          writable: true,
        },
        {
          name: "token_mint_x_program",
        },
        {
          name: "token_mint_y_program",
        },
      ],
      args: [
        {
          name: "amount_x_requested",
          type: "u64",
        },
        {
          name: "amount_y_requested",
          type: "u64",
        },
      ],
      discriminator: [22, 67, 23, 98, 150, 178, 70, 220],
      docs: [
        "# Collect Protocol Fees",
        "Collects accumulated protocol fees from pools.",
        "",
        "This administrative function allows authorized parties to collect protocol fees",
        "that have accumulated across all pools. The caller specifies the amounts of each",
        "token they wish to collect, and the function transfers those amounts to the",
        "designated fee collection accounts.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing all required accounts for fee collection",
        "* `amount_x_requested` - The amount of token X to collect",
        "* `amount_y_requested` - The amount of token Y to collect",
        "",
        "# Returns",
        "",
        "Returns `Ok(())` on successful fee collection, or an error if the operation fails.",
        "",
        "# Errors",
        "",
        "This function will return an error if:",
        "- The caller is not authorized to collect protocol fees",
        "- The requested amounts exceed available protocol fees",
        "- The fee collection accounts are not properly configured",
        "- The transfer operations fail",
      ],
      name: "collect_protocol_fees",
    },
    {
      accounts: [
        {
          address: "5hHsEaTXVNhsYT7TgkrPB3GwZ7ZYrtzC5t3KTLNuwJkB",
          docs: ["Address to be set as protocol owner."],
          name: "admin",
          signer: true,
          writable: true,
        },
        {
          docs: [
            "Initialize config state account to store protocol owner address and fee rates.",
          ],
          name: "amm_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 109, 109, 95, 99, 111, 110, 102, 105, 103],
              },
              {
                kind: "const",
                value: [0, 0, 0, 0],
              },
            ],
          },
          writable: true,
        },
        {
          address: "11111111111111111111111111111111",
          name: "system_program",
        },
      ],
      args: [
        {
          name: "trade_fee_rate",
          type: "u64",
        },
        {
          name: "protocol_fee_rate",
          type: "u64",
        },
        {
          name: "create_pool_fee",
          type: "u64",
        },
        {
          name: "wsol_trade_deposit",
          type: "u64",
        },
        {
          name: "deadline_slot_duration",
          type: "u64",
        },
        {
          name: "ratio_change_tolerance_rate",
          type: "u64",
        },
        {
          name: "halted",
          type: "bool",
        },
      ],
      discriminator: [137, 52, 237, 212, 215, 117, 108, 104],
      docs: [
        "# Create AMM Configuration",
        "Creates a new AMM (Automated Market Maker) configuration (one time).",
        "",
        "This administrative function creates a new configuration for the AMM that defines",
        "various parameters such as fee rates, pool creation fees, and operational settings.",
        "Only authorized administrators can call this function.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing all required accounts for AMM configuration creation",
        "* `trade_fee_rate` - The fee rate for trades (must be <= MAX_PERCENTAGE)",
        "* `protocol_fee_rate` - The protocol fee rate (must be <= MAX_PERCENTAGE)",
        "* `create_pool_fee` - The fee charged for creating new pools",
        "* `create_pool_fee_vault` - The vault account that receives pool creation fees",
        "* `wsol_trade_deposit` - The required deposit amount for WSOL trades",
        "* `deadline_slot_duration` - The duration (in slots) for transaction deadlines",
        "* `halted` - Whether the AMM is currently halted",
        "",
        "# Returns",
        "",
        "Returns `Ok(())` on successful configuration creation, or an error if the operation fails.",
        "",
        "# Errors",
        "",
        "This function will return an error if:",
        "- Any fee rate exceeds MAX_PERCENTAGE",
        "- The create_pool_fee_vault is the default pubkey",
        "- The caller is not authorized to create AMM configurations (only admin can do this)",
        "- The configuration accounts are not properly set up",
      ],
      name: "create_amm_config",
    },
    {
      accounts: [
        {
          name: "user",
          signer: true,
          writable: true,
        },
        {
          name: "pool",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "amm_config",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121],
              },
            ],
          },
        },
        {
          name: "amm_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 109, 109, 95, 99, 111, 110, 102, 105, 103],
              },
              {
                kind: "const",
                value: [0, 0, 0, 0],
              },
            ],
          },
        },
        {
          name: "token_mint_x",
        },
        {
          name: "token_mint_y",
        },
        {
          address: "So11111111111111111111111111111111111111112",
          name: "token_mint_wsol",
        },
        {
          name: "token_mint_lp",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [108, 112],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
          writable: true,
        },
        {
          name: "metadata_account",
          pda: {
            program: {
              kind: "const",
              value: [
                11, 112, 101, 177, 227, 209, 124, 69, 56, 157, 82, 127, 107, 4,
                195, 205, 88, 184, 108, 115, 26, 160, 253, 181, 73, 182, 209,
                188, 3, 248, 41, 70,
              ],
            },
            seeds: [
              {
                kind: "const",
                value: [109, 101, 116, 97, 100, 97, 116, 97],
              },
              {
                kind: "const",
                value: [
                  11, 112, 101, 177, 227, 209, 124, 69, 56, 157, 82, 127, 107,
                  4, 195, 205, 88, 184, 108, 115, 26, 160, 253, 181, 73, 182,
                  209, 188, 3, 248, 41, 70,
                ],
              },
              {
                kind: "account",
                path: "token_mint_lp",
              },
            ],
          },
          writable: true,
        },
        {
          name: "metadata_account_x",
          pda: {
            program: {
              kind: "const",
              value: [
                11, 112, 101, 177, 227, 209, 124, 69, 56, 157, 82, 127, 107, 4,
                195, 205, 88, 184, 108, 115, 26, 160, 253, 181, 73, 182, 209,
                188, 3, 248, 41, 70,
              ],
            },
            seeds: [
              {
                kind: "const",
                value: [109, 101, 116, 97, 100, 97, 116, 97],
              },
              {
                kind: "const",
                value: [
                  11, 112, 101, 177, 227, 209, 124, 69, 56, 157, 82, 127, 107,
                  4, 195, 205, 88, 184, 108, 115, 26, 160, 253, 181, 73, 182,
                  209, 188, 3, 248, 41, 70,
                ],
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
            ],
          },
        },
        {
          name: "metadata_account_y",
          pda: {
            program: {
              kind: "const",
              value: [
                11, 112, 101, 177, 227, 209, 124, 69, 56, 157, 82, 127, 107, 4,
                195, 205, 88, 184, 108, 115, 26, 160, 253, 181, 73, 182, 209,
                188, 3, 248, 41, 70,
              ],
            },
            seeds: [
              {
                kind: "const",
                value: [109, 101, 116, 97, 100, 97, 116, 97],
              },
              {
                kind: "const",
                value: [
                  11, 112, 101, 177, 227, 209, 124, 69, 56, 157, 82, 127, 107,
                  4, 195, 205, 88, 184, 108, 115, 26, 160, 253, 181, 73, 182,
                  209, 188, 3, 248, 41, 70,
                ],
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
        },
        {
          name: "user_token_account_x",
          pda: {
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
            seeds: [
              {
                kind: "account",
                path: "user",
              },
              {
                kind: "account",
                path: "token_mint_x_program",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
            ],
          },
          writable: true,
        },
        {
          name: "user_token_account_y",
          pda: {
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
            seeds: [
              {
                kind: "account",
                path: "user",
              },
              {
                kind: "account",
                path: "token_mint_y_program",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "user_token_account_lp",
          writable: true,
        },
        {
          name: "pool_token_reserve_x",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  112, 111, 111, 108, 95, 114, 101, 115, 101, 114, 118, 101,
                ],
              },
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
            ],
          },
          writable: true,
        },
        {
          name: "pool_token_reserve_y",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  112, 111, 111, 108, 95, 114, 101, 115, 101, 114, 118, 101,
                ],
              },
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "pool_wsol_reserve",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  112, 111, 111, 108, 95, 119, 115, 111, 108, 95, 114, 101, 115,
                  101, 114, 118, 101,
                ],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
          writable: true,
        },
        {
          address: "HNVk87PuSDucX14Eh6CJ5dNm2mG6iNpuT3PHLdbGZeLo",
          name: "create_pool_fee_vault",
          writable: true,
        },
        {
          address: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
          name: "mpl_program",
        },
        {
          address: "11111111111111111111111111111111",
          name: "system_program",
        },
        {
          address: "SysvarRent111111111111111111111111111111111",
          name: "rent",
        },
        {
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
          name: "associated_token_program",
        },
        {
          name: "token_mint_x_program",
        },
        {
          name: "token_mint_y_program",
        },
        {
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          name: "token_program",
        },
      ],
      args: [
        {
          name: "amount_x",
          type: "u64",
        },
        {
          name: "amount_y",
          type: "u64",
        },
        {
          name: "label",
          type: {
            option: {
              array: ["u8", 21],
            },
          },
        },
      ],
      discriminator: [95, 180, 10, 172, 84, 174, 232, 40],
      docs: [
        "# Initialize Pool",
        "Initializes a new liquidity pool for trading between two tokens.",
        "",
        "This function creates a new pool with initial liquidity provided by the caller.",
        "The pool will be initialized with the specified amounts of token X and token Y,",
        "and LP tokens will be minted to represent the initial liquidity position.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing all required accounts for pool initialization",
        "* `amount_x` - The initial amount of token X to add to the pool",
        "* `amount_y` - The initial amount of token Y to add to the pool",
        "",
        "# Returns",
        "",
        "Returns `Ok(())` on successful pool initialization, or an error if the operation fails.",
        "",
        "# Errors",
        "",
        "This function will return an error if:",
        "- Any of the required accounts are missing or invalid",
        "- The amounts provided are zero or invalid",
        "- The pool has already been initialized",
        "- The token accounts are not properly configured",
      ],
      name: "initialize_pool",
    },
    {
      accounts: [
        {
          name: "user",
          signer: true,
          writable: true,
        },
        {
          name: "token_mint_x",
        },
        {
          name: "token_mint_y",
        },
        {
          name: "amm_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 109, 109, 95, 99, 111, 110, 102, 105, 103],
              },
              {
                kind: "const",
                value: [0, 0, 0, 0],
              },
            ],
          },
        },
        {
          name: "token_mint_lp",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [108, 112],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
          writable: true,
        },
        {
          name: "pool",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "amm_config",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121],
              },
            ],
          },
        },
        {
          name: "user_token_account_x",
          pda: {
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
            seeds: [
              {
                kind: "account",
                path: "user",
              },
              {
                kind: "account",
                path: "token_mint_x_program",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
            ],
          },
          writable: true,
        },
        {
          name: "user_token_account_y",
          pda: {
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
            seeds: [
              {
                kind: "account",
                path: "user",
              },
              {
                kind: "account",
                path: "token_mint_y_program",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "user_token_account_lp",
          pda: {
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
            seeds: [
              {
                kind: "account",
                path: "user",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "token_mint_lp",
              },
            ],
          },
          writable: true,
        },
        {
          name: "pool_token_reserve_x",
          writable: true,
        },
        {
          name: "pool_token_reserve_y",
          writable: true,
        },
        {
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
          name: "associated_token_program",
        },
        {
          address: "11111111111111111111111111111111",
          name: "system_program",
        },
        {
          name: "token_mint_x_program",
        },
        {
          name: "token_mint_y_program",
        },
        {
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          name: "token_program",
        },
      ],
      args: [
        {
          name: "amount_lp",
          type: "u64",
        },
        {
          name: "min_receive_x",
          type: "u64",
        },
        {
          name: "min_receive_y",
          type: "u64",
        },
        {
          name: "label",
          type: {
            option: {
              array: ["u8", 21],
            },
          },
        },
      ],
      discriminator: [80, 85, 209, 72, 24, 206, 177, 108],
      docs: [
        "# Remove Liquidity",
        "Removes liquidity from an existing pool.",
        "",
        "This function allows liquidity providers to remove their liquidity from the pool",
        "and receive back their proportional share of the underlying tokens. The user specifies",
        "the amount of LP tokens to burn and minimum amounts of tokens they expect to receive.",
        "",
        "The liquidity can only be removed if the pool has enough non-locked reserves.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing all required accounts for removing liquidity",
        "* `amount_lp` - The amount of LP tokens to burn",
        "* `min_receive_x` - The minimum amount of token X the user expects to receive",
        "* `min_receive_y` - The minimum amount of token Y the user expects to receive",
        "",
        "# Returns",
        "",
        "Returns `Ok(())` on successful liquidity removal, or an error if the operation fails.",
        "",
        "# Errors",
        "",
        "This function will return an error if:",
        "- The user does not have sufficient LP tokens",
        "- The calculated amounts are below the minimum amounts specified",
        "- The pool state is invalid or the operation would break invariants",
      ],
      name: "remove_liquidity",
    },
    {
      accounts: [
        {
          name: "caller",
          signer: true,
          writable: true,
        },
        {
          name: "order_owner",
          writable: true,
        },
        {
          name: "token_mint_x",
        },
        {
          name: "token_mint_y",
        },
        {
          address: "So11111111111111111111111111111111111111112",
          name: "token_mint_wsol",
        },
        {
          name: "pool",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "amm_config",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121],
              },
            ],
          },
        },
        {
          name: "pool_token_reserve_x",
          writable: true,
        },
        {
          name: "pool_token_reserve_y",
          writable: true,
        },
        {
          name: "pool_wsol_reserve",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  112, 111, 111, 108, 95, 119, 115, 111, 108, 95, 114, 101, 115,
                  101, 114, 118, 101,
                ],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
          writable: true,
        },
        {
          name: "amm_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 109, 109, 95, 99, 111, 110, 102, 105, 103],
              },
              {
                kind: "const",
                value: [0, 0, 0, 0],
              },
            ],
          },
        },
        {
          name: "user_token_account_x",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "order_owner",
              },
              {
                kind: "account",
                path: "token_mint_x_program",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
            ],
          },
          writable: true,
        },
        {
          name: "user_token_account_y",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "order_owner",
              },
              {
                kind: "account",
                path: "token_mint_y_program",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "user_token_account_wsol",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "order_owner",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "token_mint_wsol",
              },
            ],
          },
          writable: true,
        },
        {
          name: "caller_token_account_wsol",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "caller",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "token_mint_wsol",
              },
            ],
          },
          writable: true,
        },
        {
          name: "order",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [111, 114, 100, 101, 114],
              },
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "account",
                path: "order_owner",
              },
            ],
          },
          writable: true,
        },
        {
          name: "order_token_account_wsol",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [111, 114, 100, 101, 114, 95, 119, 115, 111, 108],
              },
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "account",
                path: "order_owner",
              },
            ],
          },
          writable: true,
        },
        {
          address: "11111111111111111111111111111111",
          name: "system_program",
        },
        {
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
          name: "associated_token_program",
        },
        {
          name: "token_mint_x_program",
        },
        {
          name: "token_mint_y_program",
        },
        {
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          name: "token_program",
        },
      ],
      args: [
        {
          name: "proof_a",
          type: {
            array: ["u8", 64],
          },
        },
        {
          name: "proof_b",
          type: {
            array: ["u8", 128],
          },
        },
        {
          name: "proof_c",
          type: {
            array: ["u8", 64],
          },
        },
        {
          name: "public_inputs",
          type: {
            array: [
              {
                array: ["u8", 32],
              },
              2,
            ],
          },
        },
        {
          name: "unwrap_wsol",
          type: "bool",
        },
        {
          name: "ref_code",
          type: {
            option: {
              array: ["u8", 20],
            },
          },
        },
        {
          name: "label",
          type: {
            option: {
              array: ["u8", 21],
            },
          },
        },
      ],
      discriminator: [175, 42, 185, 87, 144, 131, 102, 212],
      docs: [
        "# Settle",
        "Settles a confidential swap using zero-knowledge proof verification.",
        "",
        "This function finalizes a previously initiated swap by verifying a zero-knowledge (groth16)",
        "proof that demonstrates the swap was executed correctly while maintaining privacy. The proof",
        "components and public inputs are provided to verify the swap's validity.",
        "",
        "Groth16 proof is generated using [snarkjs](https://github.com/darklakefi/snarkjs).",
        "Curve: bn128, wasm and final zkey files are contained within this repo settle-circuits.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing all required accounts for settlement",
        "* `proof_a` - The first component of the Groth16 zero-knowledge proof (64 bytes)",
        "* `proof_b` - The second component of the Groth16 zero-knowledge proof (128 bytes)",
        "* `proof_c` - The third component of the Groth16 zero-knowledge proof (64 bytes)",
        "* `public_inputs` - Array of two 32-byte public inputs for the proof verification.",
        "It contains real output amount and the commitment to the minimum output amount, made during the swap.",
        "",
        "# Returns",
        "",
        "Returns `Ok(())` on successful settlement, or an error if the operation fails.",
        "",
        "# Errors",
        "",
        "This function will return an error if:",
        "- The zero-knowledge proof verification fails",
        "- The public inputs are invalid or inconsistent",
        "- The settlement would violate pool invariants",
        "- The settlement deadline has passed",
        "- The swap has already been settled or cancelled",
      ],
      name: "settle",
    },
    {
      accounts: [
        {
          name: "caller",
          signer: true,
          writable: true,
        },
        {
          name: "order_owner",
          writable: true,
        },
        {
          name: "token_mint_x",
        },
        {
          name: "token_mint_y",
        },
        {
          address: "So11111111111111111111111111111111111111112",
          name: "token_mint_wsol",
        },
        {
          name: "pool",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "amm_config",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121],
              },
            ],
          },
        },
        {
          name: "pool_token_reserve_x",
          writable: true,
        },
        {
          name: "pool_token_reserve_y",
          writable: true,
        },
        {
          name: "pool_wsol_reserve",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  112, 111, 111, 108, 95, 119, 115, 111, 108, 95, 114, 101, 115,
                  101, 114, 118, 101,
                ],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
          writable: true,
        },
        {
          name: "amm_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 109, 109, 95, 99, 111, 110, 102, 105, 103],
              },
              {
                kind: "const",
                value: [0, 0, 0, 0],
              },
            ],
          },
        },
        {
          name: "user_token_account_x",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "order_owner",
              },
              {
                kind: "account",
                path: "token_mint_x_program",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
            ],
          },
          writable: true,
        },
        {
          name: "user_token_account_y",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "order_owner",
              },
              {
                kind: "account",
                path: "token_mint_y_program",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "caller_token_account_wsol",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "caller",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "token_mint_wsol",
              },
            ],
          },
          writable: true,
        },
        {
          name: "order",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [111, 114, 100, 101, 114],
              },
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "account",
                path: "order_owner",
              },
            ],
          },
          writable: true,
        },
        {
          address: "11111111111111111111111111111111",
          name: "system_program",
        },
        {
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
          name: "associated_token_program",
        },
        {
          name: "token_mint_x_program",
        },
        {
          name: "token_mint_y_program",
        },
        {
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          name: "token_program",
        },
      ],
      args: [
        {
          name: "label",
          type: {
            option: {
              array: ["u8", 21],
            },
          },
        },
      ],
      discriminator: [204, 141, 18, 161, 8, 177, 92, 142],
      docs: [
        "# Slash",
        "Executes a slash operation to penalize malicious behavior.",
        "",
        "This function allows anyone to slash (confiscate) funds from users who",
        "have failed to finalize the swap in time (deadline). The method slashes",
        "the WSOL deposit made during the swap. Tokens are returned to the original",
        "swapper.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing all required accounts for the slash operation",
        "",
        "# Returns",
        "",
        "Returns `Ok(())` on successful slash execution, or an error if the operation fails.",
        "",
        "# Errors",
        "",
        "This function will return an error if:",
        "- The slash operation would violate pool invariants",
        "- The target accounts are not properly configured",
        "- The caller doesn't have a WSOL token account",
      ],
      name: "slash",
    },
    {
      accounts: [
        {
          name: "user",
          signer: true,
          writable: true,
        },
        {
          name: "token_mint_x",
        },
        {
          name: "token_mint_y",
        },
        {
          address: "So11111111111111111111111111111111111111112",
          name: "token_mint_wsol",
        },
        {
          name: "pool",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "amm_config",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121],
              },
            ],
          },
        },
        {
          name: "amm_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 109, 109, 95, 99, 111, 110, 102, 105, 103],
              },
              {
                kind: "const",
                value: [0, 0, 0, 0],
              },
            ],
          },
        },
        {
          name: "user_token_account_x",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "user",
              },
              {
                kind: "account",
                path: "token_mint_x_program",
              },
              {
                kind: "account",
                path: "token_mint_x",
              },
            ],
          },
          writable: true,
        },
        {
          name: "user_token_account_y",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "user",
              },
              {
                kind: "account",
                path: "token_mint_y_program",
              },
              {
                kind: "account",
                path: "token_mint_y",
              },
            ],
          },
          writable: true,
        },
        {
          name: "user_token_account_wsol",
          pda: {
            program: {
              kind: "account",
              path: "associated_token_program",
            },
            seeds: [
              {
                kind: "account",
                path: "user",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "token_mint_wsol",
              },
            ],
          },
          writable: true,
        },
        {
          name: "pool_token_reserve_x",
          writable: true,
        },
        {
          name: "pool_token_reserve_y",
          writable: true,
        },
        {
          name: "pool_wsol_reserve",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  112, 111, 111, 108, 95, 119, 115, 111, 108, 95, 114, 101, 115,
                  101, 114, 118, 101,
                ],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
          writable: true,
        },
        {
          name: "order",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [111, 114, 100, 101, 114],
              },
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "account",
                path: "user",
              },
            ],
          },
          writable: true,
        },
        {
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
          name: "associated_token_program",
        },
        {
          address: "11111111111111111111111111111111",
          name: "system_program",
        },
        {
          name: "token_mint_x_program",
        },
        {
          name: "token_mint_y_program",
        },
        {
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          name: "token_program",
        },
      ],
      args: [
        {
          name: "amount_in",
          type: "u64",
        },
        {
          name: "is_swap_x_to_y",
          type: "bool",
        },
        {
          name: "c_min",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "label",
          type: {
            option: {
              array: ["u8", 21],
            },
          },
        },
      ],
      discriminator: [248, 198, 158, 145, 225, 117, 135, 200],
      docs: [
        "# Swap",
        "Performs a confidential swap between tokens in the pool.",
        "",
        "This function executes a swap operation while maintaining confidentiality of the",
        "trade details. The swap direction is determined by the `is_swap_x_to_y` parameter,",
        "and the minimum output amount is specified as a commitment `c_min` to preserve privacy.",
        "Commitment is a poseidon hash of the minimum output amount with a random salt",
        "(poseidon hash function has to match circom implementation parameters).",
        "",
        "Poseidon hash can be generated using [circomlibjs](https://www.npmjs.com/package/circomlibjs/v/0.1.7).",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing all required accounts for the swap",
        "* `amount_in` - The amount of input tokens to swap",
        "* `is_swap_x_to_y` - If true, swap token X for token Y; if false, swap token Y for token X",
        "* `c_min` - A 32-byte commitment representing the minimum output amount (for privacy)",
        "",
        "# Returns",
        "",
        "Returns `Ok(())` on successful swap execution, or an error if the operation fails.",
        "",
        "# Errors",
        "",
        "This function will return an error if:",
        "- The user does not have sufficient input tokens",
        "- The swap would result in slippage beyond acceptable limits",
        "- The pool does not have sufficient liquidity",
        "- The swap violates pool invariants",
      ],
      name: "swap",
    },
    {
      accounts: [
        {
          address: "5hHsEaTXVNhsYT7TgkrPB3GwZ7ZYrtzC5t3KTLNuwJkB",
          docs: ["The config admin"],
          name: "admin",
          signer: true,
        },
        {
          docs: ["Config account to be changed"],
          name: "amm_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [97, 109, 109, 95, 99, 111, 110, 102, 105, 103],
              },
              {
                kind: "const",
                value: [0, 0, 0, 0],
              },
            ],
          },
          writable: true,
        },
      ],
      args: [
        {
          name: "param",
          type: "u8",
        },
        {
          name: "value",
          type: "u64",
        },
      ],
      discriminator: [49, 60, 174, 136, 154, 28, 116, 200],
      docs: [
        "# Update AMM Configuration",
        "Updates an existing AMM configuration parameter.",
        "",
        "This administrative function allows authorized parties to update specific parameters",
        "of an existing AMM configuration. The parameter to update is specified by a numeric",
        "identifier, and the new value is provided.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing all required accounts for AMM configuration update",
        "* `param` - The parameter identifier to update (u8)",
        "* `value` - The new value for the specified parameter",
        "",
        "# Returns",
        "",
        "Returns `Ok(())` on successful configuration update, or an error if the operation fails.",
        "",
        "# Errors",
        "",
        "This function will return an error if:",
        "- The caller is not authorized to update AMM configurations",
        "- The parameter identifier is invalid",
        "- The new value violates constraints or invariants",
        "- The configuration does not exist",
      ],
      name: "update_amm_config",
    },
  ],
  metadata: {
    description: "Darklake",
    name: "darklake",
    spec: "0.1.0",
    version: "0.1.1",
  },
  types: [
    {
      name: "AddLiquidity",
      type: {
        fields: [
          {
            name: "supplier",
            type: "pubkey",
          },
          {
            name: "max_amount_x",
            type: "u64",
          },
          {
            name: "max_amount_y",
            type: "u64",
          },
          {
            name: "transfer_in_x",
            type: "u64",
          },
          {
            name: "transfer_in_y",
            type: "u64",
          },
          {
            name: "liquidity_minted",
            type: "u64",
          },
          {
            name: "user_token_lp_balance",
            type: "u64",
          },
          {
            name: "new_reserve_x",
            type: "u64",
          },
          {
            name: "new_reserve_y",
            type: "u64",
          },
          {
            name: "available_reserve_x",
            type: "u64",
          },
          {
            name: "available_reserve_y",
            type: "u64",
          },
          {
            name: "token_mint_lp",
            type: "pubkey",
          },
          {
            name: "token_mint_x",
            type: "pubkey",
          },
          {
            name: "token_mint_y",
            type: "pubkey",
          },
          {
            name: "ref_code",
            type: "string",
          },
          {
            name: "label",
            type: "string",
          },
        ],
        kind: "struct",
      },
    },
    {
      name: "AmmConfig",
      type: {
        fields: [
          {
            name: "trade_fee_rate",
            type: "u64",
          },
          {
            name: "create_pool_fee",
            type: "u64",
          },
          {
            name: "protocol_fee_rate",
            type: "u64",
          },
          {
            name: "wsol_trade_deposit",
            type: "u64",
          },
          {
            name: "deadline_slot_duration",
            type: "u64",
          },
          {
            name: "ratio_change_tolerance_rate",
            type: "u64",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "halted",
            type: "bool",
          },
          {
            docs: ["padding"],
            name: "padding",
            type: {
              array: ["u64", 16],
            },
          },
        ],
        kind: "struct",
      },
    },
    {
      name: "Cancel",
      type: {
        fields: [
          {
            name: "caller",
            type: "pubkey",
          },
          {
            name: "trader",
            type: "pubkey",
          },
          {
            name: "direction",
            type: "u8",
          },
          {
            name: "deadline",
            type: "u64",
          },
          {
            name: "protocol_fee",
            type: "u64",
          },
          {
            name: "amount_in",
            type: "u64",
          },
          {
            name: "amount_out",
            type: "u64",
          },
          {
            name: "wsol_to_order_owner",
            type: "u64",
          },
          {
            name: "wsol_to_caller",
            type: "u64",
          },
          {
            name: "sol_to_caller",
            type: "u64",
          },
          {
            name: "actual_amount_in",
            type: "u64",
          },
          {
            name: "new_reserve_x",
            type: "u64",
          },
          {
            name: "new_reserve_y",
            type: "u64",
          },
          {
            name: "available_reserve_x",
            type: "u64",
          },
          {
            name: "available_reserve_y",
            type: "u64",
          },
          {
            name: "locked_x",
            type: "u64",
          },
          {
            name: "locked_y",
            type: "u64",
          },
          {
            name: "user_locked_x",
            type: "u64",
          },
          {
            name: "user_locked_y",
            type: "u64",
          },
          {
            name: "protocol_fee_x",
            type: "u64",
          },
          {
            name: "protocol_fee_y",
            type: "u64",
          },
          {
            name: "user_token_account_x",
            type: "pubkey",
          },
          {
            name: "user_token_account_y",
            type: "pubkey",
          },
          {
            name: "token_mint_lp",
            type: "pubkey",
          },
          {
            name: "token_mint_x",
            type: "pubkey",
          },
          {
            name: "token_mint_y",
            type: "pubkey",
          },
          {
            name: "label",
            type: "string",
          },
        ],
        kind: "struct",
      },
    },
    {
      name: "InitializePool",
      type: {
        fields: [
          {
            name: "trader",
            type: "pubkey",
          },
          {
            name: "liquidity_minted",
            type: "u64",
          },
          {
            name: "sol_create_pool_fee",
            type: "u64",
          },
          {
            name: "new_reserve_x",
            type: "u64",
          },
          {
            name: "new_reserve_y",
            type: "u64",
          },
          {
            name: "token_mint_x",
            type: "pubkey",
          },
          {
            name: "token_mint_y",
            type: "pubkey",
          },
          {
            name: "token_mint_lp",
            type: "pubkey",
          },
          {
            name: "label",
            type: "string",
          },
        ],
        kind: "struct",
      },
    },
    {
      name: "Order",
      type: {
        fields: [
          {
            name: "trader",
            type: "pubkey",
          },
          {
            name: "token_mint_x",
            type: "pubkey",
          },
          {
            name: "token_mint_y",
            type: "pubkey",
          },
          {
            name: "actual_in",
            type: "u64",
          },
          {
            name: "exchange_in",
            type: "u64",
          },
          {
            name: "actual_out",
            type: "u64",
          },
          {
            name: "from_to_lock",
            type: "u64",
          },
          {
            name: "d_in",
            type: "u64",
          },
          {
            name: "d_out",
            type: "u64",
          },
          {
            name: "deadline",
            type: "u64",
          },
          {
            name: "protocol_fee",
            type: "u64",
          },
          {
            name: "wsol_deposit",
            type: "u64",
          },
          {
            name: "c_min",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "is_x_to_y",
            type: "bool",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "padding",
            type: {
              array: ["u64", 4],
            },
          },
        ],
        kind: "struct",
      },
    },
    {
      name: "Pool",
      type: {
        fields: [
          {
            name: "creator",
            type: "pubkey",
          },
          {
            name: "amm_config",
            type: "pubkey",
          },
          {
            name: "token_mint_x",
            type: "pubkey",
          },
          {
            name: "token_mint_y",
            type: "pubkey",
          },
          {
            name: "reserve_x",
            type: "pubkey",
          },
          {
            name: "reserve_y",
            type: "pubkey",
          },
          {
            name: "token_lp_supply",
            type: "u64",
          },
          {
            name: "protocol_fee_x",
            type: "u64",
          },
          {
            name: "protocol_fee_y",
            type: "u64",
          },
          {
            name: "locked_x",
            type: "u64",
          },
          {
            name: "locked_y",
            type: "u64",
          },
          {
            name: "user_locked_x",
            type: "u64",
          },
          {
            name: "user_locked_y",
            type: "u64",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "padding",
            type: {
              array: ["u64", 4],
            },
          },
        ],
        kind: "struct",
      },
    },
    {
      name: "RemoveLiquidity",
      type: {
        fields: [
          {
            name: "supplier",
            type: "pubkey",
          },
          {
            name: "min_amount_x",
            type: "u64",
          },
          {
            name: "min_amount_y",
            type: "u64",
          },
          {
            name: "transfer_out_x",
            type: "u64",
          },
          {
            name: "transfer_out_y",
            type: "u64",
          },
          {
            name: "liquidity_burned",
            type: "u64",
          },
          {
            name: "user_token_lp_balance",
            type: "u64",
          },
          {
            name: "new_reserve_x",
            type: "u64",
          },
          {
            name: "new_reserve_y",
            type: "u64",
          },
          {
            name: "available_reserve_x",
            type: "u64",
          },
          {
            name: "available_reserve_y",
            type: "u64",
          },
          {
            name: "token_mint_lp",
            type: "pubkey",
          },
          {
            name: "token_mint_x",
            type: "pubkey",
          },
          {
            name: "token_mint_y",
            type: "pubkey",
          },
          {
            name: "label",
            type: "string",
          },
        ],
        kind: "struct",
      },
    },
    {
      name: "Settle",
      type: {
        fields: [
          {
            name: "caller",
            type: "pubkey",
          },
          {
            name: "trader",
            type: "pubkey",
          },
          {
            name: "direction",
            type: "u8",
          },
          {
            name: "deadline",
            type: "u64",
          },
          {
            name: "protocol_fee",
            type: "u64",
          },
          {
            name: "amount_in",
            type: "u64",
          },
          {
            name: "amount_out",
            type: "u64",
          },
          {
            name: "actual_amount_in",
            type: "u64",
          },
          {
            name: "wsol_to_trader",
            type: "u64",
          },
          {
            name: "wsol_to_caller",
            type: "u64",
          },
          {
            name: "sol_to_trader",
            type: "u64",
          },
          {
            name: "actual_amount_out",
            type: "u64",
          },
          {
            name: "new_reserve_x",
            type: "u64",
          },
          {
            name: "new_reserve_y",
            type: "u64",
          },
          {
            name: "available_reserve_x",
            type: "u64",
          },
          {
            name: "available_reserve_y",
            type: "u64",
          },
          {
            name: "locked_x",
            type: "u64",
          },
          {
            name: "locked_y",
            type: "u64",
          },
          {
            name: "user_locked_x",
            type: "u64",
          },
          {
            name: "user_locked_y",
            type: "u64",
          },
          {
            name: "protocol_fee_x",
            type: "u64",
          },
          {
            name: "protocol_fee_y",
            type: "u64",
          },
          {
            name: "user_token_account_x",
            type: "pubkey",
          },
          {
            name: "user_token_account_y",
            type: "pubkey",
          },
          {
            name: "token_mint_lp",
            type: "pubkey",
          },
          {
            name: "token_mint_x",
            type: "pubkey",
          },
          {
            name: "token_mint_y",
            type: "pubkey",
          },
          {
            name: "ref_code",
            type: "string",
          },
          {
            name: "label",
            type: "string",
          },
        ],
        kind: "struct",
      },
    },
    {
      name: "Slash",
      type: {
        fields: [
          {
            name: "caller",
            type: "pubkey",
          },
          {
            name: "trader",
            type: "pubkey",
          },
          {
            name: "direction",
            type: "u8",
          },
          {
            name: "deadline",
            type: "u64",
          },
          {
            name: "protocol_fee",
            type: "u64",
          },
          {
            name: "amount_in",
            type: "u64",
          },
          {
            name: "amount_out",
            type: "u64",
          },
          {
            name: "wsol_to_trader",
            type: "u64",
          },
          {
            name: "wsol_to_caller",
            type: "u64",
          },
          {
            name: "sol_to_caller",
            type: "u64",
          },
          {
            name: "actual_amount_in",
            type: "u64",
          },
          {
            name: "new_reserve_x",
            type: "u64",
          },
          {
            name: "new_reserve_y",
            type: "u64",
          },
          {
            name: "available_reserve_x",
            type: "u64",
          },
          {
            name: "available_reserve_y",
            type: "u64",
          },
          {
            name: "locked_x",
            type: "u64",
          },
          {
            name: "locked_y",
            type: "u64",
          },
          {
            name: "user_locked_x",
            type: "u64",
          },
          {
            name: "user_locked_y",
            type: "u64",
          },
          {
            name: "protocol_fee_x",
            type: "u64",
          },
          {
            name: "protocol_fee_y",
            type: "u64",
          },
          {
            name: "user_token_account_x",
            type: "pubkey",
          },
          {
            name: "user_token_account_y",
            type: "pubkey",
          },
          {
            name: "token_mint_lp",
            type: "pubkey",
          },
          {
            name: "token_mint_x",
            type: "pubkey",
          },
          {
            name: "token_mint_y",
            type: "pubkey",
          },
          {
            name: "label",
            type: "string",
          },
        ],
        kind: "struct",
      },
    },
    {
      name: "Swap",
      type: {
        fields: [
          {
            name: "trader",
            type: "pubkey",
          },
          {
            name: "direction",
            type: "u8",
          },
          {
            name: "deadline",
            type: "u64",
          },
          {
            name: "trade_fee",
            type: "u64",
          },
          {
            name: "protocol_fee",
            type: "u64",
          },
          {
            name: "amount_in",
            type: "u64",
          },
          {
            name: "amount_out",
            type: "u64",
          },
          {
            name: "actual_amount_in",
            type: "u64",
          },
          {
            name: "wsol_deposit",
            type: "u64",
          },
          {
            name: "actual_amount_out",
            type: "u64",
          },
          {
            name: "new_reserve_x",
            type: "u64",
          },
          {
            name: "new_reserve_y",
            type: "u64",
          },
          {
            name: "available_reserve_x",
            type: "u64",
          },
          {
            name: "available_reserve_y",
            type: "u64",
          },
          {
            name: "locked_x",
            type: "u64",
          },
          {
            name: "locked_y",
            type: "u64",
          },
          {
            name: "user_locked_x",
            type: "u64",
          },
          {
            name: "user_locked_y",
            type: "u64",
          },
          {
            name: "protocol_fee_x",
            type: "u64",
          },
          {
            name: "protocol_fee_y",
            type: "u64",
          },
          {
            name: "user_token_account_x",
            type: "pubkey",
          },
          {
            name: "user_token_account_y",
            type: "pubkey",
          },
          {
            name: "token_mint_lp",
            type: "pubkey",
          },
          {
            name: "token_mint_x",
            type: "pubkey",
          },
          {
            name: "token_mint_y",
            type: "pubkey",
          },
          {
            name: "label",
            type: "string",
          },
        ],
        kind: "struct",
      },
    },
  ],
};
