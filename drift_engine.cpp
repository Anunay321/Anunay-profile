/**
 * @file drift_engine.cpp
 * @brief Drift Pro C++ Simulation Engine Implementation
 */

#include "drift_engine.hpp"
#include <random>
#include <algorithm>
#include <iostream>

namespace Drift {

static const SceneMetadata SCENE_CATALOG[] = {
    {"Ember",      {1.0f, 0.25f, 0.64f}, {1.0f, 0.63f, 0.84f}, 0.35f, 0.0f, 0.0f, "It begins as a single spark", "A small point of light, waiting for a nudge."},
    {"Passage",    {0.10f, 0.78f, 1.0f},  {0.60f, 0.96f, 1.0f},  0.0f,  0.0f, 0.0f, "Then it opens into a passage", "Move through it. The particles part around you."},
    {"Vortex",     {0.55f, 0.36f, 0.96f}, {0.94f, 0.65f, 1.0f},  0.0f,  0.0f, 0.0f, "Then it draws you inward", "Everything spirals toward one quiet center."},
    {"Black hole", {1.0f, 0.42f, 0.10f},  {1.0f, 0.89f, 0.66f}, 1.0f,  1.0f, 1.0f, "Past the point of no return", "Light bends around an empty center. Tap to send a shockwave."},
    {"Entwine",    {0.06f, 0.90f, 0.63f}, {0.77f, 1.0f, 0.91f},  0.0f,  0.0f, 0.0f, "Two threads wind into one", "Structure appears where there was only motion."},
    {"Mobius",     {0.64f, 0.90f, 0.21f}, {0.96f, 1.0f, 0.77f},  0.0f,  0.0f, 0.0f, "One side, one edge, no end", "Follow the surface and you return to the start, flipped."},
    {"Knot",       {1.0f, 0.82f, 0.25f},  {1.0f, 0.95f, 0.69f},  0.0f,  0.0f, 0.0f, "One line that never ends", "A single curve looping through itself."},
    {"Torus",      {0.23f, 0.51f, 0.96f}, {0.74f, 0.84f, 1.0f},  0.0f,  0.0f, 0.0f, "A ring that holds its shape", "Rings and meridians, evenly spaced."},
    {"Klein",      {0.91f, 0.47f, 0.98f}, {1.0f, 0.85f, 1.0f},  0.0f,  0.0f, 0.0f, "A bottle with no inside", "A surface that passes straight through itself."},
    {"Lorenz",     {0.30f, 0.85f, 1.0f},  {0.73f, 0.65f, 1.0f},  0.0f,  0.0f, 0.0f, "Order hidden inside chaos", "A weather model that never repeats and never escapes."},
    {"Tide",       {1.0f, 0.30f, 0.37f},  {1.0f, 0.72f, 0.66f},  0.0f,  0.0f, 0.0f, "Motion settles into waves", "Ripples travel outward and fade."},
    {"Globe",      {0.18f, 0.90f, 0.78f}, {0.49f, 0.61f, 1.0f},  0.0f,  0.0f, 0.0f, "A world drawn in lines", "Latitude and longitude, one particle at a time."},
    {"Supernova",  {1.0f, 0.23f, 0.19f},  {1.0f, 0.82f, 0.40f}, 0.9f,  0.0f, 0.0f, "Then everything lets go", "A star's last light, thrown outward. Tap to feel it."},
    {"Halo",       {0.37f, 0.69f, 1.0f},  {1.0f, 0.62f, 0.90f},  0.0f,  0.0f, 0.0f, "And finally, into orbit", "Scroll back up to run the whole sequence again."}
};

const SceneMetadata& DriftSimulationEngine::get_scene_metadata(size_t index) {
    if (index >= sizeof(SCENE_CATALOG) / sizeof(SCENE_CATALOG[0])) {
        index = 0;
    }
    return SCENE_CATALOG[index];
}

size_t DriftSimulationEngine::get_scene_count() {
    return sizeof(SCENE_CATALOG) / sizeof(SCENE_CATALOG[0]);
}

static inline float quantize(float v, float steps) {
    return std::round(v * steps) / steps;
}

static inline Vector3 spherical_dist(float u, float v) {
    float z = u * 2.0f - 1.0f;
    float phi = v * TAU;
    float r = std::sqrt(std::max(0.0f, 1.0f - z * z));
    return {r * std::cos(phi), z, r * std::sin(phi)};
}

DriftSimulationEngine::DriftSimulationEngine(size_t particle_count)
    : count_(particle_count),
      particles_(particle_count),
      flat_positions_(particle_count * 3, 0.0f) {
    
    compute_lorenz_attractor(24000);
    precompute_all_geometries();

    // Initialize particle states
    std::mt19937 rng(42);
    std::uniform_real_distribution<float> dist(0.0f, 1.0f);

    for (size_t i = 0; i < count_; ++i) {
        particles_[i].random_seed = {dist(rng), dist(rng), dist(rng)};
        particles_[i].size = 0.8f + dist(rng) * 0.9f;
        particles_[i].current_pos = scene_targets_[0][i].position;
        flat_positions_[i * 3 + 0] = particles_[i].current_pos.x;
        flat_positions_[i * 3 + 1] = particles_[i].current_pos.y;
        flat_positions_[i * 3 + 2] = particles_[i].current_pos.z;
    }
}

void DriftSimulationEngine::compute_lorenz_attractor(size_t steps) {
    lorenz_cache_.reserve(steps);
    float x = 0.1f, y = 0.0f, z = 0.0f;
    constexpr float dt = 0.006f;

    // Warm-up phase
    for (int i = 0; i < 3000; ++i) {
        float dx = 10.0f * (y - x);
        float dy = x * (28.0f - z) - y;
        float dz = x * y - (8.0f / 3.0f) * z;
        x += dx * dt; y += dy * dt; z += dz * dt;
    }

    // Capture trajectory
    for (size_t i = 0; i < steps; ++i) {
        float dx = 10.0f * (y - x);
        float dy = x * (28.0f - z) - y;
        float dz = x * y - (8.0f / 3.0f) * z;
        x += dx * dt; y += dy * dt; z += dz * dt;
        lorenz_cache_.push_back({x, y, z});
    }
}

ParticleTarget DriftSimulationEngine::generate_shape_point(SceneShape shape, float ra, float rb, float rc) {
    ParticleTarget pt;

    switch (shape) {
        case SceneShape::Ember: {
            Vector3 d = spherical_dist(ra, rb);
            float lump = 1.0f + 0.22f * std::sin(3.1f * d.x + 1.7f * d.y) * std::cos(2.3f * d.z + 0.6f * d.y)
                              + 0.10f * std::sin(6.0f * d.y + 4.0f * d.x);
            float r = 1.55f * lump * (0.35f + 0.65f * std::pow(rc, 0.45f));
            pt.position = {d.x * r, d.y * r * 1.12f, d.z * r};
            break;
        }
        case SceneShape::Passage: {
            float u = ra * 2.0f - 1.0f;
            float qq = quantize((u + 1.0f) * 0.5f, 64.0f) * 2.0f - 1.0f;
            float uu = (rb < 0.78f) ? qq : u;
            float a = rc * TAU;
            float rad = (0.85f + 0.55f * std::cos(uu * 1.5708f));
            pt.position = {uu * 2.35f, std::cos(a) * rad * 0.9f, std::sin(a) * rad};
            pt.orbit_tilt = 0.25f;
            break;
        }
        case SceneShape::Vortex: {
            float t = std::pow(ra, 0.85f);
            int arm = static_cast<int>(rb * 3.0f);
            float ang = t * 11.0f + arm * (TAU / 3.0f) + (rc - 0.5f) * 0.22f;
            float r = 0.12f + 2.4f * std::pow(1.0f - t, 1.5f);
            pt.position = {std::cos(ang) * r, (0.5f - t) * 4.3f, std::sin(ang) * r};
            break;
        }
        case SceneShape::BlackHole: {
            if (ra < 0.70f) {
                float r = 1.18f + std::pow(rb, 1.7f) * 2.15f;
                float a = rc * TAU;
                pt.position = {std::cos(a) * r, (ra - 0.5f) * 0.05f * r, std::sin(a) * r};
                pt.orbit_speed = 1.3f;
                pt.orbit_tilt = 0.42f;
            } else if (ra < 0.85f) {
                float a = rb * TAU;
                float rr = 1.06f + (rc - 0.5f) * 0.07f + std::pow(ra, 4.0f) * 0.18f;
                pt.position = {std::cos(a) * rr, std::sin(a) * rr, (rc - 0.5f) * 0.06f};
            } else {
                float sign = (rb < 0.5f) ? 1.0f : -1.0f;
                float a = sign * (PI * 0.5f) + (rc - 0.5f) * 2.4f;
                float r2 = 1.16f + ra * 0.5f;
                pt.position = {std::cos(a) * r2, std::sin(a) * r2 * 1.05f, (rc - 0.5f) * 0.1f};
            }
            break;
        }
        case SceneShape::Entwine: {
            float t = ra * 2.0f - 1.0f;
            float a = t * TAU * 1.6f + ((rb < 0.5f) ? 0.0f : PI);
            constexpr float rr = 0.95f;
            pt.position = {std::cos(a) * rr, t * 2.3f, std::sin(a) * rr};
            break;
        }
        case SceneShape::Mobius: {
            float u = ra * TAU;
            float v = rb * 2.0f - 1.0f;
            constexpr float h = 0.8f, Sc = 1.6f;
            float rad = 1.0f + h * v * std::cos(u * 0.5f);
            pt.position = {Sc * rad * std::cos(u), Sc * h * v * std::sin(u * 0.5f), Sc * rad * std::sin(u)};
            pt.orbit_tilt = 0.5f;
            break;
        }
        case SceneShape::Knot: {
            float t = ra * TAU;
            float rc_val = std::cos(3.0f * t) + 2.0f;
            Vector3 center = {rc_val * std::cos(2.0f * t) * 0.7f, rc_val * std::sin(2.0f * t) * 0.7f, -std::sin(3.0f * t) * 0.7f};
            Vector3 d = spherical_dist(rb, rc);
            pt.position = center + d * 0.14f;
            pt.orbit_tilt = 0.3f;
            break;
        }
        case SceneShape::Torus: {
            float u = ra * TAU, v = rb * TAU;
            constexpr float Rr = 1.7f, rr = 0.68f;
            float rad = Rr + rr * std::cos(v);
            pt.position = {rad * std::cos(u), rr * std::sin(v), rad * std::sin(u)};
            pt.orbit_tilt = 0.55f;
            break;
        }
        case SceneShape::Klein: {
            float u = ra * TAU, v = rb * TAU;
            float cu = std::cos(u * 0.5f), su = std::sin(u * 0.5f);
            float rad = 2.0f + cu * std::sin(v) - su * std::sin(2.0f * v);
            constexpr float sc = 0.62f;
            pt.position = {rad * std::cos(u) * sc, (su * std::sin(v) + cu * std::sin(2.0f * v)) * sc * 1.05f, rad * std::sin(u) * sc};
            pt.orbit_tilt = 0.45f;
            break;
        }
        case SceneShape::Lorenz: {
            size_t idx = static_cast<size_t>(ra * (lorenz_cache_.size() - 1));
            const auto& p = lorenz_cache_[idx];
            constexpr float sc = 0.085f;
            pt.position = {p.x * sc, (p.z - 25.0f) * sc, p.y * sc};
            pt.orbit_tilt = 0.12f;
            break;
        }
        case SceneShape::Tide: {
            float r = 2.85f * std::sqrt(ra);
            float a = rb * TAU;
            float x = std::cos(a) * r, z = std::sin(a) * r;
            float y = 0.5f * std::sin(r * 3.0f) * std::exp(-r * 0.28f) + 0.12f * std::sin(x * 4.0f) * std::cos(z * 3.0f);
            pt.position = {x, y, z};
            pt.orbit_tilt = 0.5f;
            break;
        }
        case SceneShape::Globe: {
            constexpr float r = 1.75f;
            float ph = quantize(ra * 2.0f - 1.0f, 6.0f) * 1.3f;
            float th = rb * TAU;
            pt.position = {r * std::cos(ph) * std::cos(th), r * std::sin(ph), r * std::cos(ph) * std::sin(th)};
            pt.orbit_tilt = 0.4f;
            break;
        }
        case SceneShape::Supernova: {
            Vector3 d = spherical_dist(ra, rb);
            float r = 0.25f + std::pow(rc, 0.75f) * 2.7f;
            pt.position = d * r;
            break;
        }
        case SceneShape::Halo: {
            int arm = static_cast<int>(ra * 3.0f);
            float r = 0.15f + 2.75f * std::pow(rb, 0.7f);
            float a = r * 1.6f + arm * (TAU / 3.0f) + (rc - 0.5f) * 0.5f / (0.5f + r * 0.3f);
            pt.position = {std::cos(a) * r, (rc - 0.5f) * 0.2f * (1.2f - r * 0.3f), std::sin(a) * r};
            pt.orbit_speed = 0.9f;
            pt.orbit_tilt = 0.6f;
            break;
        }
        default:
            pt.position = {0.0f, 0.0f, 0.0f};
            break;
    }
    return pt;
}

void DriftSimulationEngine::precompute_all_geometries() {
    size_t num_scenes = get_scene_count();
    scene_targets_.resize(num_scenes);

    std::mt19937 rng(1337);
    std::uniform_real_distribution<float> dist(0.0f, 1.0f);

    for (size_t s = 0; s < num_scenes; ++s) {
        scene_targets_[s].resize(count_);
        auto shape = static_cast<SceneShape>(s);
        for (size_t i = 0; i < count_; ++i) {
            scene_targets_[s][i] = generate_shape_point(shape, dist(rng), dist(rng), dist(rng));
        }
    }
}

void DriftSimulationEngine::update(float delta_time, float scene_progress, float mouse_x, float mouse_y, float pulse_intensity) {
    size_t max_p = get_scene_count() - 1;
    scene_progress = std::max(0.0f, std::min(static_cast<float>(max_p), scene_progress));

    size_t i0 = static_cast<size_t>(std::floor(scene_progress));
    size_t i1 = std::min(i0 + 1, max_p);
    float f = scene_progress - static_cast<float>(i0);
    float ease = f * f * (3.0f - 2.0f * f);

    const auto& t0 = scene_targets_[i0];
    const auto& t1 = scene_targets_[i1];

    for (size_t i = 0; i < count_; ++i) {
        Vector3 target_pos = Vector3::lerp(t0[i].position, t1[i].position, ease);

        // Transition displacement
        float s = std::sin(PI * ease);
        target_pos.x += (particles_[i].random_seed.x - 0.5f) * s * 2.4f;
        target_pos.y += (particles_[i].random_seed.y - 0.5f) * s * 2.4f;
        target_pos.z += (particles_[i].random_seed.z - 0.5f) * s * 2.4f;

        particles_[i].current_pos = target_pos;

        flat_positions_[i * 3 + 0] = target_pos.x;
        flat_positions_[i * 3 + 1] = target_pos.y;
        flat_positions_[i * 3 + 2] = target_pos.z;
    }
}

} // namespace Drift

// ----------------------------------------------------
// C-ABI Exports
// ----------------------------------------------------
extern "C" {
    void* drift_create_engine(int particle_count) {
        return new Drift::DriftSimulationEngine(particle_count > 0 ? particle_count : 40000);
    }

    void drift_step_engine(void* handle, float dt, float progress, float mx, float my, float pulse) {
        if (!handle) return;
        static_cast<Drift::DriftSimulationEngine*>(handle)->update(dt, progress, mx, my, pulse);
    }

    const float* drift_get_positions(void* handle) {
        if (!handle) return nullptr;
        return static_cast<Drift::DriftSimulationEngine*>(handle)->get_flat_positions_buffer();
    }

    int drift_get_particle_count(void* handle) {
        if (!handle) return 0;
        return static_cast<int>(static_cast<Drift::DriftSimulationEngine*>(handle)->get_particle_count());
    }

    void drift_destroy_engine(void* handle) {
        delete static_cast<Drift::DriftSimulationEngine*>(handle);
    }
}

#ifdef DRIFT_STANDALONE_BENCHMARK
int main() {
    std::cout << "Drift Pro C++ Simulation Engine - Initializing 50,000 particles...\n";
    Drift::DriftSimulationEngine engine(50000);
    std::cout << "Simulating 120 steps across scene sequence...\n";
    for (int step = 0; step < 120; ++step) {
        float progress = (step / 120.0f) * 13.0f;
        engine.update(0.016f, progress, 0.0f, 0.0f, 0.0f);
    }
    std::cout << "Benchmark complete. Output particle sample: (" 
              << engine.get_flat_positions_buffer()[0] << ", "
              << engine.get_flat_positions_buffer()[1] << ", "
              << engine.get_flat_positions_buffer()[2] << ")\n";
    return 0;
}
#endif
