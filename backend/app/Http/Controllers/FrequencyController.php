<?php

namespace App\Http\Controllers;

use App\Http\Requests\FrequencyRequest;
use App\Http\Resources\FrequencyResource;
use App\Models\Frequency;
use Illuminate\Http\JsonResponse;

class FrequencyController extends Controller
{

    public function index(): JsonResponse
    {
        return response()->json([
            'frequencies' => FrequencyResource::collection(Frequency::orderBy('name')->get()),
        ]);
    }


    public function show(string $frequency): JsonResponse
    {
        $model = Frequency::findOrFail($frequency);

        return response()->json([
            'frequency' => new FrequencyResource($model),
        ]);
    }


    public function store(FrequencyRequest $request): JsonResponse
    {
        $frequency = Frequency::create($request->validated());

        return response()->json([
            'frequency' => new FrequencyResource($frequency),
        ], 201);
    }

    public function update(FrequencyRequest $request, string $frequency): JsonResponse
    {
        $model = Frequency::findOrFail($frequency);
        $model->update($request->validated());

        return response()->json([
            'frequency' => new FrequencyResource($model),
        ]);
    }


    public function destroy(string $frequency): JsonResponse
    {
        $model = Frequency::findOrFail($frequency);

        if ($model->tasks()->exists()) {
            return response()->json([
                'message' => 'This frequency is currently assigned to tasks and cannot be deleted.',
            ], 422);
        }

        $model->delete();

        return response()->json([
            'message' => 'Frequency deleted.',
        ]);
    }
}
