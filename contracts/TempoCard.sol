// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TempoCard {
    uint256 public nextCardId = 1;

    struct CardEntry {
        address creator;
        string title;
        string mood;
        uint256 bpm;
        uint256 energy;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => CardEntry) private cards;

    event CardPublished(
        uint256 indexed cardId,
        address indexed creator,
        string title,
        string mood,
        uint256 bpm,
        uint256 energy,
        string note
    );

    function publishCard(
        string calldata title,
        string calldata mood,
        uint256 bpm,
        uint256 energy,
        string calldata note
    ) external returns (uint256 cardId) {
        require(bytes(title).length > 0 && bytes(title).length <= 32, "Invalid title");
        require(bytes(mood).length > 0 && bytes(mood).length <= 24, "Invalid mood");
        require(bytes(note).length > 0 && bytes(note).length <= 180, "Invalid note");
        require(bpm >= 70 && bpm <= 180, "Invalid bpm");
        require(energy >= 1 && energy <= 5, "Invalid energy");

        cardId = nextCardId++;
        cards[cardId] = CardEntry({
            creator: msg.sender,
            title: title,
            mood: mood,
            bpm: bpm,
            energy: energy,
            note: note,
            createdAt: block.timestamp
        });

        emit CardPublished(cardId, msg.sender, title, mood, bpm, energy, note);
    }

    function getCard(
        uint256 cardId
    )
        external
        view
        returns (
            address creator,
            string memory title,
            string memory mood,
            uint256 bpm,
            uint256 energy,
            string memory note,
            uint256 createdAt
        )
    {
        CardEntry storage entry = cards[cardId];
        return (
            entry.creator,
            entry.title,
            entry.mood,
            entry.bpm,
            entry.energy,
            entry.note,
            entry.createdAt
        );
    }
}
