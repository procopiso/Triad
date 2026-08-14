// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Triad {
    uint8 public constant DRAW = 0;
    uint8 public constant WIN = 1;
    uint8 public constant LOSS = 2;

    struct Profile {
        uint64 rounds;
        uint64 wins;
        uint64 losses;
        uint64 draws;
        uint64 checkIns;
        uint64 lastCheckInDay;
        uint64 lastPlayedAt;
        uint16 streak;
        uint8 lastPlayerMove;
        uint8 lastChainMove;
        uint8 lastOutcome;
    }

    mapping(address => Profile) private profiles;
    uint256 private entropyNonce;

    uint64 public globalRounds;
    uint64 public globalCheckIns;

    event RoundPlayed(address indexed player, uint8 playerMove, uint8 chainMove, uint8 outcome, uint64 round);
    event CheckedIn(address indexed player, uint64 indexed day, uint16 streak);

    function play(uint8 playerMove) external {
        require(playerMove < 3, "Invalid move");

        unchecked {
            entropyNonce++;
        }

        uint8 chainMove = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.prevrandao,
                        blockhash(block.number - 1),
                        msg.sender,
                        entropyNonce,
                        playerMove
                    )
                )
            ) % 3
        );

        uint8 outcome;
        if (playerMove == chainMove) {
            outcome = DRAW;
        } else if ((playerMove + 1) % 3 == chainMove) {
            outcome = LOSS;
        } else {
            outcome = WIN;
        }

        Profile storage profile = profiles[msg.sender];
        profile.rounds++;
        profile.lastPlayerMove = playerMove;
        profile.lastChainMove = chainMove;
        profile.lastOutcome = outcome;
        profile.lastPlayedAt = uint64(block.timestamp);

        if (outcome == WIN) {
            profile.wins++;
        } else if (outcome == LOSS) {
            profile.losses++;
        } else {
            profile.draws++;
        }

        globalRounds++;
        emit RoundPlayed(msg.sender, playerMove, chainMove, outcome, profile.rounds);
    }

    function dailyCheckIn() external {
        uint64 today = uint64(block.timestamp / 1 days);
        Profile storage profile = profiles[msg.sender];
        require(profile.lastCheckInDay != today, "Already checked in");

        if (profile.lastCheckInDay + 1 == today) {
            profile.streak++;
        } else {
            profile.streak = 1;
        }

        profile.lastCheckInDay = today;
        profile.checkIns++;
        globalCheckIns++;

        emit CheckedIn(msg.sender, today, profile.streak);
    }

    function profileOf(address user) external view returns (Profile memory) {
        return profiles[user];
    }
}
