/**
 * @file drift_engine.hpp
 * @brief Drift Pro High-Performance C++ Simulation Engine
 * 
 * Provides vector math, numerical ODE solvers (RK4 for chaotic attractors),
 * 14 manifold geometry generators, and CPU particle state evaluation.
 * Compatible with C++17/C++20, WebAssembly (Emscripten), and native engine plugins.
 */

#ifndef DRIFT_ENGINE_HPP
#define DRIFT_ENGINE_HPP

#include <vector>
#include <cmath>
#include <cstdint>
#include <string>
#include <memory>

namespace Drift {

constexpr float PI = 3.14159265358979323846f;
constexpr float TAU = 2.0f * PI;

struct Vector3 {
    float x{0.0f}, y{0.0f}, z{0.0f};

    Vector3() = default;
    Vector3(float x_, float y_, float z_) : x(x_), y(y_), z(z_) {}

    Vector3 operator+(const Vector3& o) const { return {x + o.x, y + o.y, z + o.z}; }
    Vector3 operator-(const Vector3& o) const { return {x - o.x, y - o.y, z - o.z}; }
    Vector3 operator*(float s) const { return {x * s, y * s, z * s}; }
    Vector3 operator/(float s) const { return {x / s, y / s, z / s}; }

    Vector3& operator+=(const Vector3& o) { x += o.x; y += o.y; z += o.z; return *this; }
    Vector3& operator-=(const Vector3& o) { x -= o.x; y -= o.y; z -= o.z; return *this; }

    float length_sq() const { return x * x + y * y + z * z; }
    float length() const { return std::sqrt(length_sq()); }

    Vector3 normalized() const {
        float l = length();
        return l > 1e-6f ? (*this / l) : Vector3{0.0f, 0.0f, 0.0f};
    }

    static Vector3 lerp(const Vector3& a, const Vector3& b, float t) {
        return a + (b - a) * t;
    }
};

struct Vector2 {
    float x{0.0f}, y{0.0f};
};

struct ColorRGB {
    float r{1.0f}, g{1.0f}, b{1.0f};
};

struct ParticleTarget {
    Vector3 position;
    float orbit_speed{0.0f};
    float orbit_tilt{0.0f};
};

struct Particle {
    Vector3 current_pos;
    Vector3 current_vel;
    Vector3 random_seed;
    float size{1.0f};
    float alpha{1.0f};
    ColorRGB color;
};

enum class SceneShape : uint8_t {
    Ember = 0,
    Passage,
    Vortex,
    BlackHole,
    Entwine,
    Mobius,
    Knot,
    Torus,
    Klein,
    Lorenz,
    Tide,
    Globe,
    Supernova,
    Halo,
    Count
};

struct SceneMetadata {
    const char* name;
    ColorRGB color_a;
    ColorRGB color_b;
    float hot_intensity{0.0f};
    float lens_factor{0.0f};
    float still_factor{0.0f};
    const char* headline;
    const char* subtitle;
};

class DriftSimulationEngine {
public:
    explicit DriftSimulationEngine(size_t particle_count = 40000);
    ~DriftSimulationEngine() = default;

    void update(float delta_time, float scene_progress, float mouse_x, float mouse_y, float pulse_intensity);
    
    [[nodiscard]] size_t get_particle_count() const { return count_; }
    [[nodiscard]] const Particle* get_particles_data() const { return particles_.data(); }
    [[nodiscard]] const float* get_flat_positions_buffer() const { return flat_positions_.data(); }

    static const SceneMetadata& get_scene_metadata(size_t index);
    static size_t get_scene_count();

private:
    size_t count_;
    std::vector<Particle> particles_;
    std::vector<float> flat_positions_; // [x0, y0, z0, x1, y1, z1, ...]
    std::vector<std::vector<ParticleTarget>> scene_targets_; // [14 scenes][count]
    std::vector<Vector3> lorenz_cache_;

    void precompute_all_geometries();
    void compute_lorenz_attractor(size_t steps);
    ParticleTarget generate_shape_point(SceneShape shape, float rnd_a, float rnd_b, float rnd_c);
};

} // namespace Drift

// ----------------------------------------------------
// C-ABI Export Interface for WebAssembly / Engine FFI
// ----------------------------------------------------
extern "C" {
    void* drift_create_engine(int particle_count);
    void  drift_step_engine(void* handle, float dt, float progress, float mx, float my, float pulse);
    const float* drift_get_positions(void* handle);
    int   drift_get_particle_count(void* handle);
    void  drift_destroy_engine(void* handle);
}

#endif // DRIFT_ENGINE_HPP
