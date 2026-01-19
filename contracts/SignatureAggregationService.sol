// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SignatureAggregationService
 * @notice Central service for signature packing, unpacking, and batch verification
 * @dev Reduces calldata and gas costs through compact signature representation
 */

contract SignatureAggregationService {
    /// @notice Compact signature format (64 bytes instead of 65)
    struct CompactSignature {
        bytes32 r;      // 32 bytes
        bytes32 s;      // 32 bytes
        // v encoded in high bit of s during packing
    }

    /// @notice Signature data with metadata
    struct SignatureData {
        address signer;
        uint8 v;
        bytes32 r;
        bytes32 s;
        uint256 index;  // Position in original array
    }

    /// @notice Batch verification result
    struct BatchVerificationResult {
        bool allValid;
        uint256 validCount;
        uint256 invalidCount;
        address[] validSigners;
        uint256[] invalidIndices;
    }

    // Events
    event SignaturePacked(bytes32 indexed messageHash, uint256 signatureCount, uint256 packedSize);
    event SignatureUnpacked(bytes32 indexed messageHash, uint256 signatureCount);
    event BatchVerified(bytes32 indexed messageHash, uint256 validCount, uint256 totalCount);

    // Constants
    uint256 private constant COMPACT_SIGNATURE_SIZE = 64; // r + s (no v byte)
    uint256 private constant STANDARD_SIGNATURE_SIZE = 65; // r + s + v

    /// @notice Pack signatures into compact format for reduced calldata
    /// @param signatures Array of standard signatures (65 bytes each)
    /// @return packedSignatures Compact signatures (64 bytes each)
    /// @dev Saves ~1 byte per signature (1.5% reduction per signature)
    function packSignatures(bytes[] calldata signatures) 
        external 
        pure 
        returns (bytes memory packedSignatures) 
    {
        require(signatures.length > 0, "No signatures to pack");
        require(signatures.length <= 10, "Too many signatures (max 10)");

        // Calculate packed size: 1 byte for count + (64 bytes per signature)
        uint256 packedSize = 1 + (signatures.length * COMPACT_SIGNATURE_SIZE);
        packedSignatures = new bytes(packedSize);

        // First byte: count of signatures
        packedSignatures[0] = bytes1(uint8(signatures.length));

        // Pack each signature
        for (uint256 i = 0; i < signatures.length; i++) {
            require(signatures[i].length == STANDARD_SIGNATURE_SIZE, "Invalid signature length");

            // Extract r, s, v from standard signature
            bytes32 r;
            bytes32 s;
            uint8 v;

            assembly {
                // Load signature data from calldata
                let sig := signatures.offset
                // Add i * 32 to move through array, then add 32 for array length prefix
                let sigData := add(sig, add(32, mul(i, 96)))
                
                // Load r (first 32 bytes)
                r := calldataload(sigData)
                // Load s (second 32 bytes)
                s := calldataload(add(sigData, 32))
                // Load v (first byte of third 32 bytes)
                v := byte(0, calldataload(add(sigData, 64)))
            }

            // Encode v into high bit of s for packing
            if (v == 27) {
                s = bytes32(uint256(s) | (1 << 255));
            }
            // v == 28, bit already 0

            // Write packed signature to memory
            uint256 offset = 1 + (i * COMPACT_SIGNATURE_SIZE);
            assembly {
                // Write r at offset
                mstore(add(packedSignatures, add(32, offset)), r)
                // Write s at offset + 32
                mstore(add(packedSignatures, add(64, offset)), s)
            }
        }
    }

    /// @notice Unpack compact signatures back to standard format
    /// @param packedSignatures Compact signatures (64 bytes each)
    /// @return signatures Array of standard signatures (65 bytes each)
    function unpackSignatures(bytes calldata packedSignatures) 
        external 
        pure 
        returns (bytes[] memory signatures) 
    {
        require(packedSignatures.length >= 1, "Invalid packed signatures");

        uint256 count = uint8(packedSignatures[0]);
        require(packedSignatures.length == 1 + (count * COMPACT_SIGNATURE_SIZE), "Malformed packed data");
        require(count > 0 && count <= 10, "Invalid signature count");

        signatures = new bytes[](count);

        for (uint256 i = 0; i < count; i++) {
            // Extract packed signature at offset
            uint256 offset = 1 + (i * COMPACT_SIGNATURE_SIZE);

            bytes32 r;
            bytes32 s;
            uint8 v;

            assembly {
                // Load r and s from packed data
                let packedData := add(packedSignatures.offset, offset)
                r := calldataload(packedData)
                s := calldataload(add(packedData, 32))
            }

            // Decode v from high bit of s
            uint256 sValue = uint256(s);
            if ((sValue >> 255) == 1) {
                v = 27;
                s = bytes32(sValue & ((1 << 255) - 1));
            } else {
                v = 28;
            }

            // Construct standard signature
            signatures[i] = abi.encodePacked(r, s, v);
        }
    }

    /// @notice Calculate gas savings from packing
    /// @param signatureCount Number of signatures
    /// @return savedBytes Bytes saved vs standard format
    /// @return savingsPercent Percentage savings
    function calculateGasSavings(uint256 signatureCount) 
        external 
        pure 
        returns (uint256 savedBytes, uint256 savingsPercent) 
    {
        uint256 standardSize = signatureCount * STANDARD_SIGNATURE_SIZE;
        uint256 compactSize = signatureCount * COMPACT_SIGNATURE_SIZE;
        
        savedBytes = standardSize - compactSize;
        savingsPercent = (savedBytes * 100) / standardSize;
    }

    /// @notice Verify batch of signatures (returns all signers)
    /// @param messageHash Hash that was signed
    /// @param signatures Compact packed signatures
    /// @return signers Array of signer addresses (including recovered addresses)
    /// @dev Uses compact format for input, returns full signer data
    function batchRecoverSigners(bytes32 messageHash, bytes calldata signatures)
        external
        pure
        returns (address[] memory signers)
    {
        require(signatures.length >= 1, "Invalid signatures");

        uint256 count = uint8(signatures[0]);
        signers = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 offset = 1 + (i * COMPACT_SIGNATURE_SIZE);

            bytes32 r;
            bytes32 s;
            uint8 v;

            assembly {
                let sigData := add(signatures.offset, offset)
                r := calldataload(sigData)
                s := calldataload(add(sigData, 32))
            }

            // Decode v
            uint256 sValue = uint256(s);
            if ((sValue >> 255) == 1) {
                v = 27;
                s = bytes32(sValue & ((1 << 255) - 1));
            } else {
                v = 28;
            }

            // Recover signer
            bytes32 ethSignedMessageHash = keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
            );
            signers[i] = ecrecover(ethSignedMessageHash, v, r, s);
        }
    }

    /// @notice Verify signatures and return unique valid signers
    /// @param messageHash Hash that was signed
    /// @param signatures Compact packed signatures
    /// @param guardians Array of valid guardian addresses
    /// @return validSigners Array of valid unique signers
    /// @return duplicateIndices Indices of duplicate signers
    function verifyAndFilterSignatures(
        bytes32 messageHash,
        bytes calldata signatures,
        address[] calldata guardians
    ) 
        external 
        pure 
        returns (address[] memory validSigners, uint256[] memory duplicateIndices) 
    {
        require(signatures.length >= 1, "No signatures");

        uint256 count = uint8(signatures[0]);
        require(count > 0 && count <= guardians.length, "Invalid signature count");

        // Create guardian lookup
        mapping(address => bool) guardianMap;
        for (uint256 i = 0; i < guardians.length; i++) {
            guardianMap[guardians[i]] = true;
        }

        // Track unique signers
        address[] memory uniqueSigners = new address[](count);
        uint256[] memory duplicates = new uint256[](count);
        uint256 uniqueCount = 0;
        uint256 duplicateCount = 0;

        mapping(address => bool) seenSigners;

        for (uint256 i = 0; i < count; i++) {
            // Recover signer
            address signer = _recoverSignerAtIndex(messageHash, signatures, i);

            // Check if valid guardian
            if (!guardianMap[signer]) {
                continue;
            }

            // Check for duplicates
            if (seenSigners[signer]) {
                duplicates[duplicateCount] = i;
                duplicateCount++;
                continue;
            }

            seenSigners[signer] = true;
            uniqueSigners[uniqueCount] = signer;
            uniqueCount++;
        }

        // Resize arrays
        validSigners = new address[](uniqueCount);
        duplicateIndices = new uint256[](duplicateCount);

        for (uint256 i = 0; i < uniqueCount; i++) {
            validSigners[i] = uniqueSigners[i];
        }

        for (uint256 i = 0; i < duplicateCount; i++) {
            duplicateIndices[i] = duplicates[i];
        }
    }

    /// @notice Internal function to recover signer at specific index
    function _recoverSignerAtIndex(bytes32 messageHash, bytes calldata signatures, uint256 index)
        internal
        pure
        returns (address)
    {
        require(signatures.length >= 1, "Invalid signatures");
        uint256 count = uint8(signatures[0]);
        require(index < count, "Index out of bounds");

        uint256 offset = 1 + (index * COMPACT_SIGNATURE_SIZE);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            let sigData := add(signatures.offset, offset)
            r := calldataload(sigData)
            s := calldataload(add(sigData, 32))
        }

        // Decode v
        uint256 sValue = uint256(s);
        if ((sValue >> 255) == 1) {
            v = 27;
            s = bytes32(sValue & ((1 << 255) - 1));
        } else {
            v = 28;
        }

        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    /// @notice Get size comparison for packing
    /// @param signatureCount Number of signatures
    /// @return standardSize Size in standard format
    /// @return compactSize Size in compact format
    function getFormatSizes(uint256 signatureCount)
        external
        pure
        returns (uint256 standardSize, uint256 compactSize)
    {
        standardSize = signatureCount * STANDARD_SIGNATURE_SIZE;
        compactSize = 1 + (signatureCount * COMPACT_SIGNATURE_SIZE);
    }

    /// @notice Hash withdrawal data for signing
    /// @param token Token address
    /// @param amount Withdrawal amount
    /// @param recipient Recipient address
    /// @param nonce Replay protection nonce
    /// @param reason Withdrawal reason
    /// @return Hash of withdrawal data
    function hashWithdrawal(
        address token,
        uint256 amount,
        address recipient,
        uint256 nonce,
        string calldata reason
    ) 
        external 
        pure 
        returns (bytes32) 
    {
        return keccak256(abi.encode(token, amount, recipient, nonce, reason));
    }

    /// @notice Verify all signatures are valid (no recovery errors)
    /// @param messageHash Hash that was signed
    /// @param signatures Compact packed signatures
    /// @return allValid True if all signatures recovered successfully
    /// @return validCount Count of valid signatures
    function verifySignaturesValidity(bytes32 messageHash, bytes calldata signatures)
        external
        pure
        returns (bool allValid, uint256 validCount)
    {
        require(signatures.length >= 1, "No signatures");
        uint256 count = uint8(signatures[0]);

        validCount = 0;
        for (uint256 i = 0; i < count; i++) {
            address signer = _recoverSignerAtIndex(messageHash, signatures, i);
            if (signer != address(0)) {
                validCount++;
            }
        }

        allValid = validCount == count;
    }
}
