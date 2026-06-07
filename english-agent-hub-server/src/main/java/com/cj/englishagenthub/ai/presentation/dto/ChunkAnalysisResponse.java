package com.cj.englishagenthub.ai.presentation.dto;

import java.util.List;

public record ChunkAnalysisResponse(
        List<Chunk> chunks,
        String natural,
        String tip
) {
    public record Chunk(
            String en,
            String ko,
            String note
    ) {
    }
}
