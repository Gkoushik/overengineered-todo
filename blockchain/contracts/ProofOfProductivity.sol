// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProofOfProductivity {
    struct CompletedTask {
        string taskName;
        uint256 taskId;
        uint256 timestamp;
        address completedBy;
    }

    CompletedTask[] public completions;
    mapping(address => uint256[]) public userCompletions;

    event TaskCompletedOnChain(
        uint256 indexed completionId,
        address indexed user,
        string taskName,
        uint256 taskId,
        uint256 timestamp
    );

    function completeTask(string memory taskName, uint256 taskId) public {
        uint256 completionId = completions.length;
        completions.push(CompletedTask({
            taskName: taskName,
            taskId: taskId,
            timestamp: block.timestamp,
            completedBy: msg.sender
        }));
        userCompletions[msg.sender].push(completionId);

        emit TaskCompletedOnChain(completionId, msg.sender, taskName, taskId, block.timestamp);
    }

    function getCompletionHistory(address user) public view returns (uint256[] memory) {
        return userCompletions[user];
    }

    function getCompletion(uint256 id) public view returns (CompletedTask memory) {
        return completions[id];
    }

    function totalCompletions() public view returns (uint256) {
        return completions.length;
    }
}
