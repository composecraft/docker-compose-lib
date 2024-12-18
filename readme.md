# compose-craft-lib

A TypeScript library for working with Docker Compose configurations, providing strong typing and easy manipulation of Docker Compose data structures.

this lib is behind [composecraft.com](https://composecraft.com)

## Overview

`compose-craft-lib` is a powerful TypeScript library designed to simplify working with Docker Compose configurations. It offers:
- Strong TypeScript typing for Docker Compose structures
- Easy creation and manipulation of compose configurations
- Translation between different representation formats
- Intuitive, object-oriented approach to defining services and configurations

## Features

- Type-safe Docker Compose configuration management
- Support for creating and modifying services, images, and port mappings
- Translator design pattern for flexible configuration handling
- Comprehensive type definitions

## Installation

Install the library using npm:

```bash
npm install @composecraft/docker-compose-lib
```

Or using yarn:

```bash
yarn add @composecraft/docker-compose-lib
```

Or using pnpm:

```bash
pnpm add @composecraft/docker-compose-lib
```

## Usage Examples

### Basic Composition Creation

```typescript
import { Compose, Service, Image, PortMapping, Translator } from "@composecraft/docker-compose-lib"
import { stringify } from "yaml";

// Create a new Compose configuration
const compose = new Compose({name: "demo"});

// Define a web service
const webService = new Service({
    name: "web",
    image: new Image({ name: "nginx" }),
    ports: [new PortMapping({ hostPort: 80, containerPort: 80 })],
});

// Add the service to the composition
compose.addService(webService);

// Translate to a dictionary and convert to YAML
const translator = new Translator(compose);
const yamlConfig = stringify(translator.toDict());
```

## API Documentation

For detailed API documentation, please visit the [official documentation](https://composecraft.github.io/docker-compose-lib).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Project Link: [https://github.com/composecraft/docker-compose-lib](https://github.com/composecraft/docker-compose-lib)