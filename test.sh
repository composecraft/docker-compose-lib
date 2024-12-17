#!/bin/bash

# Step 1: Compile TypeScript for all files in testReal folder
for ts_file in testReal/*.ts; do
    tsc "$ts_file"

    echo -e "\e[32mTypeScript file $ts_file compiled successfully 🔨!\e[0m"

    # Step 2: Run the compiled JavaScript file and capture the file path
    js_file="${ts_file%.ts}.js"

    # Run the compiled JavaScript file and capture the output as yaml_file
    yaml_file=$(node "$js_file")

    # Step 3: Generate Docker Compose YAML file
    docker-compose -f "$yaml_file" config -q

    # Print cool message if everything is ok, else print error message with ts file
    # Print in green if everything is ok, else print in red
    if [ $? -eq 0 ]; then
        echo -e "\e[32mDocker Compose YAML file $yaml_file is valid ⭐️!\e[0m"
    else
        echo -e "\e[31mError: Docker Compose YAML file generation failed for $ts_file!\e[0m"
        echo -e "\e[31mError: Check $yaml_file \n TS $ts_file for errors.\e[0m"
    fi
done
