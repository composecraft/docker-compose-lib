import {
    AccessType,
    Binding,
    Build, Env,
    Image,
    Network,
    NetworkDriver,
    Service,
    Translator,
    Volume,
    VolumeDriver,
    Protocol
} from "../../src";
import { expect } from "@jest/globals";
import * as fs from "node:fs";
import YAML from "yaml"
import * as path from "node:path";

describe("read compose file", () => {

    const input = `{"version":"3.8","name":"my_project","services":{"web":{"image":"nginx","volumes":["./nginx/nginx.conf:/tmp/nginx.conf:ro"],"environment":["FLASK_SERVER_ADDR=backend:9091"],"command":"/bin/bash -c \\"envsubst < /tmp/nginx.conf > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'\\"","ports":["8080:80"],"depends_on":["backend"],"networks":["my_network"]},"backend":{"build":{"context":"flask","target":"builder"},"stop_signal":"SIGINT","environment":["FLASK_SERVER_PORT=9091"],"volumes":["./flask:/src","./backend_logs:/logs","backend_data:/data"],"depends_on":["mongo"],"networks":["my_network"]},"mongo":{"image":"mongo:v1","volumes":["./mongo_data:/data/db","mongo_data:/data/db"],"networks":["my_network"]}},"networks":{"my_network":{"driver":"bridge"}},"volumes":{"backend_data":{"driver":"local"},"mongo_data":{"driver":"local"}}}`

    test("top level attributes", () => {
        const result = Translator.fromDict(JSON.parse(input))
        expect(result).toBeDefined()

        expect(result.name).toBe("my_project")
        expect(result.version).toBe(3.8)
    });

    test("attributes numbers", () => {
        const result = Translator.fromDict(JSON.parse(input))
        expect(result).toBeDefined()

        expect(result.services.size).toBe(3)
        expect(result.networks.size).toBe(1)
        expect(result.volumes.size).toBe(2)
        expect(result.envs.size).toBe(2)
    });

    test("ensure network are as expected", () => {
        const result = Translator.fromDict(JSON.parse(input))
        expect(result).toBeDefined()

        const network = Array.from(result.networks)[0] as Network
        expect(network).toBeDefined()
        expect(network?.name).toBe("my_network")
        expect(network?.driver).toBe(NetworkDriver.BRIDGE)
    });

    test("ensure volume are as expected", () => {
        const result = Translator.fromDict(JSON.parse(input))
        expect(result).toBeDefined()

        const volume = Array.from(result.volumes)[0] as Volume
        expect(volume).toBeDefined()
        expect(volume?.name).toBe("backend_data")
        expect(volume?.driver).toBe(VolumeDriver.LOCAL)
    });

    test("ensure services are as expected", () => {
        const result = Translator.fromDict(JSON.parse(input))
        expect(result).toBeDefined()

        const nginx = Array.from(result.services)[0] as Service
        expect(nginx).toBeDefined()
        expect(nginx?.name).toBe("web")
        expect(nginx.image).toStrictEqual(new Image({name: "nginx", tag:"latest"}))
        expect(nginx?.command).toStrictEqual(['/bin/bash', '-c', '"envsubst', '<', '/tmp/nginx.conf', '>', '/etc/nginx/conf.d/default.conf', '&&', 'nginx', '-g', "'daemon", `off;'"`])
        expect(Array.from<Binding>(nginx.bindings)[0].source).toBe("./nginx/nginx.conf")
        expect(Array.from<Binding>(nginx.bindings)[0].target).toBe("/tmp/nginx.conf")
        expect(Array.from<Binding>(nginx.bindings)[0].mode).toBe(AccessType.READ_ONLY)
        expect(nginx.ports?.length).toBe(1)
        expect(nginx.ports?.[0]?.hostPort).toBe(8080)
        expect(nginx.ports?.[0]?.containerPort).toBe(80)

        const flask = Array.from(result.services)[1] as Service
        expect(flask).toBeDefined()
        expect(flask?.name).toBe("backend")
        expect(flask.build).toStrictEqual(new Build({context:"flask",target:"builder"}))

        const mongo = Array.from(result.services)[2] as Service
        expect(mongo).toBeDefined()
        expect(mongo?.name).toBe("mongo")
        expect(mongo.image).toStrictEqual(new Image({name: "mongo", tag:"v1"}))
    });

    test("links are has expected",()=>{
        const result = Translator.fromDict(JSON.parse(input))

        const mongo = Array.from<Service>(result.services)[2]
        const nginx = Array.from<Service>(result.services)[0]
        const nginx_networks = Array.from<Network>(nginx.networks)
        const nginx_envs = Array.from<Env>(nginx.environment || [])
        expect(nginx_networks.find(net=>net.name ==="my_network")).toBeDefined()
        expect(nginx_envs.find(env=>env.key ==="FLASK_SERVER_ADDR")).toBeDefined()

        const flask = Array.from<Service>(result.services)[1]

        expect(flask.bindings.size).toBe(3)
        expect(flask.depends_on.has(mongo)).toBeTruthy()
    })

    test("envs are has expected",()=>{
        const result = Translator.fromDict(JSON.parse(input))
        expect(Array.from(result.envs).length).toBe(2)
        expect(Array.from<Env>(result.envs)[0].key).toBe("FLASK_SERVER_ADDR")
        expect(Array.from<Env>(result.envs)[0].value).toBe("backend:9091")
        expect(Array.from<Env>(result.envs)[1].key).toBe("FLASK_SERVER_PORT")
        expect(Array.from<Env>(result.envs)[1].value).toBe("9091")
    })

    test("not test if not sepcified",()=>{
        const result = Translator.fromDict(JSON.parse(input))
        const nginx = Array.from<Service>(result.services)[0]

        expect(nginx.healthcheck).toBeUndefined()
    })

    test("file 2",()=>{
        const input2 = `{"services":{"web":{"image":"nginx","volumes":["./nginx/nginx.conf:/tmp/nginx.conf"],"environment":["FLASK_SERVER_ADDR=backend:9091"],"command":"/bin/bash -c \\"envsubst < /tmp/nginx.conf > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'\\"","ports":["80:80"],"depends_on":["backend"]},"backend":{"build":{"context":"flask","target":"builder"},"stop_signal":"SIGINT","environment":["FLASK_SERVER_PORT=9091"],"volumes":["./flask:/src"],"depends_on":["mongo"]},"mongo":{"image":"mongo"}}}`
        const result = Translator.fromDict(JSON.parse(input2))
        expect(result.services.size).toBe(3)
    })

    test("file 3",()=>{
        const specialInput = `{"services":{"api":{"build":{"context":".","target":"builder"},"container_name":"fastapi-application","environment":{"PORT":8000},"ports":["8000:8000"],"restart":"no"}}}`
        const result = Translator.fromDict(JSON.parse(specialInput))
        expect((Array.from(result.envs)[0] as Env).key).toBe("PORT")
        expect((Array.from(result.envs)[0] as Env).value).toBe("8000")
    })

    test("file 4",()=>{
        const specialInput = `{"services":{"elasticsearch":{"image":"elasticsearch:7.16.1","container_name":"es","environment":{"discovery.type":"single-node","ES_JAVA_OPTS":"-Xms512m -Xmx512m"},"ports":["9200:9200","9300:9300"],"healthcheck":{"test":["CMD-SHELL","curl --silent --fail localhost:9200/_cluster/health || exit 1"],"interval":"10s","timeout":"10s","retries":3},"networks":["elastic"]},"logstash":{"image":"logstash:7.16.1","container_name":"log","environment":{"discovery.seed_hosts":"logstash","LS_JAVA_OPTS":"-Xms512m -Xmx512m"},"volumes":["./logstash/pipeline/logstash-nginx.config:/usr/share/logstash/pipeline/logstash-nginx.config","./logstash/nginx.log:/home/nginx.log"],"ports":["5000:5000/tcp","5000:5000/udp","5044:5044","9600:9600"],"depends_on":["elasticsearch"],"networks":["elastic"],"command":"logstash -f /usr/share/logstash/pipeline/logstash-nginx.config"},"kibana":{"image":"kibana:7.16.1","container_name":"kib","ports":["5601:5601"],"depends_on":["elasticsearch"],"networks":["elastic"]}},"networks":{"elastic":{"driver":"bridge"}}}`
        const result = Translator.fromDict(JSON.parse(specialInput))
        expect(result).toBeDefined()
    })

    test("file 5",()=>{
        const specialInput =`{"services":{"minecraft":{"image":"itzg/minecraft-server","ports":["25565:25565"],"environment":{"EULA":"TRUE"},"deploy":{"resources":{"limits":{"memory":"1.5G"}}},"volumes":["~/minecraft_data:/data"]}}}`
        const result = Translator.fromDict(JSON.parse(specialInput))
        expect(result).toBeDefined()
    })

    test("file 6",()=>{
        const specialInput =`{"services":{"backend":{"build":"backend","restart":"always","secrets":["db-password"],"environment":{"MYSQL_HOST":"db"},"networks":["react-spring","spring-mysql"],"depends_on":{"db":{"condition":"service_healthy"}}},"db":{"image":"mariadb:10.6.4-focal","environment":["MYSQL_DATABASE=example","MYSQL_ROOT_PASSWORD_FILE=/run/secrets/db-password"],"restart":"always","healthcheck":{"test":["CMD","mysqladmin","ping","-h","127.0.0.1","--silent"],"interval":"3s","retries":5,"start_period":"30s"},"secrets":["db-password"],"volumes":["db-data:/var/lib/mysql"],"networks":["spring-mysql"]},"frontend":{"build":{"context":"frontend","target":"development"},"ports":["3000:3000"],"volumes":["./frontend/src:/code/src","/project/node_modules"],"networks":["react-spring"],"depends_on":["backend"],"expose":[3306,33060]}},"volumes":{"db-data":{}},"secrets":{"db-password":{"file":"db/password.txt"}},"networks":{"react-spring":{},"spring-mysql":{}}}`
        const result = Translator.fromDict(JSON.parse(specialInput))
        expect(result).toBeDefined()
    })

    test("file 7",()=>{
        const specialInput =`{"services":{"elasticsearch":{"image":"elasticsearch:7.16.1","container_name":"es","environment":{"discovery.type":"single-node","ES_JAVA_OPTS":"-Xms512m -Xmx512m"},"ports":["9200:9200","9300:9300"],"healthcheck":{"test":["CMD-SHELL","curl --silent --fail localhost:9200/_cluster/health || exit 1"],"interval":"10s","timeout":"10s","retries":3},"networks":["elastic"]},"logstash":{"image":"logstash:7.16.1","container_name":"log","environment":{"discovery.seed_hosts":"logstash","LS_JAVA_OPTS":"-Xms512m -Xmx512m"},"volumes":["./logstash/pipeline/logstash-nginx.config:/usr/share/logstash/pipeline/logstash-nginx.config","./logstash/nginx.log:/home/nginx.log"],"ports":["5000:5000/tcp","5000:5000/udp","5044:5044","9600:9600"],"depends_on":["elasticsearch"],"networks":["elastic"],"command":"logstash -f /usr/share/logstash/pipeline/logstash-nginx.config"},"kibana":{"image":"kibana:7.16.1","container_name":"kib","ports":["5601:5601"],"depends_on":["elasticsearch"],"networks":["elastic"]}},"networks":{"elastic":{"driver":"bridge"}}}`
        const result = Translator.fromDict(JSON.parse(specialInput))
        expect(result).toBeDefined()
    })

    test("file 8",()=>{
        const specialInput = `{"services":{"cs2-server":{"image":"joedwards32/cs2","container_name":"cs2-dedicated-server","restart":"unless-stopped","environment":["SRCDS_TOKEN=<YOUR-GAME-SERVER-TOKEN>","CS2_SERVERNAME=MY-CS2-SERVER","CS2_CHEATS=0","CS2_PORT=27015","CS2_SERVER_HIBERNATE=0","CS2_LAN=0","CS2_RCONPW=cruelly-sequel-dejected","CS2_PW=sake-earthly-lair","CS2_MAXPLAYERS=10","CS2_GAMEALIAS=competitive","CS2_GAMETYPE=0","CS2_GAMEMODE=1","CS2_MAPGROUP=mg_active","CS2_STARTMAP=de_dust2","CS2_BOT_DIFFICULTY=0","CS2_BOT_QUOTA=0","CS2_BOT_QUOTA_MODE=competitive","TV_AUTORECORD=0","TV_ENABLE=0","TV_PORT=27020","TV_PW=changeme","TV_RELAY_PW=changeme","TV_MAXRATE=0","TV_DELAY=0"],"volumes":["cs2:/home/steam/cs2-dedicated/"],"ports":["27015:27015/tcp","27015:27015/udp"]},"cs2-rconpanel":{"image":"soren90/rcon-panel","container_name":"cs2-rcon-panel","ports":["3000:3000"],"restart":"unless-stopped"}},"volumes":{"cs2":null}}`
        const result = Translator.fromDict(JSON.parse(specialInput))
        expect(result).toBeDefined()
    })

    test("file 8",()=>{
        const specialInput = `{"services":{"matomo":{"image":"matomo:5-fpm-alpine","container_name":"matomo","ports":["8099:80"],"expose":[80],"volumes":["\${DOCKER_VOLUME_STORAGE:-/mnt/docker-volumes}/matomo/apache/apache2.conf:/etc/apache2/apache2.conf:ro","\${DOCKER_VOLUME_STORAGE:-/mnt/docker-volumes}/matomo/html:/var/www/html"],"environment":["MATOMO_DATABASE_HOST=matomo_db"],"env_file":["./db.env"],"depends_on":["matomo_db"],"restart":"unless-stopped"},"matomo_db":{"image":"mariadb:11.5","container_name":"matomo_db","command":"--max-allowed-packet=64MB","environment":["MYSQL_ROOT_PASSWORD=makeitup"],"env_file":["./db.env"],"expose":[3306],"restart":"unless-stopped","volumes":["\${DOCKER_VOLUME_STORAGE:-/mnt/docker-volumes}/matomo/database:/var/lib/mysql"]}}}`
        const result = Translator.fromDict(JSON.parse(specialInput))
        expect(result).toBeDefined()
    })

    test("file 9",()=>{
        const specialInput = `{"services":{"nitter":{"image":"zedeus/nitter:latest","container_name":"nitter","ports":["8080:8080"],"expose":[8080],"volumes":["\${DOCKER_VOLUME_STORAGE:-/mnt/docker-volumes}/nitter/nitter.conf:/src/nitter.conf:ro"],"depends_on":["nitter-redis"],"restart":"unless-stopped","healthcheck":{"test":"wget -nv --tries=1 --spider http://127.0.0.1:8080/Jack/status/20 || exit 1","interval":"30s","timeout":"5s","retries":2}},"nitter-redis":{"image":"redis:7-alpine","container_name":"nitter-redis","command":"redis-server --save 60 1 --loglevel warning","volumes":["\${DOCKER_VOLUME_STORAGE:-/mnt/docker-volumes}/nitter/data:/data"],"restart":"unless-stopped","healthcheck":{"test":"redis-cli ping","interval":"30s","timeout":"5s","retries":2}}}}`
        const result = Translator.fromDict(JSON.parse(specialInput))
        expect(result).toBeDefined()
    })

    test("file 10",()=>{
        const specialInput = `{"services":{"app":{"image":"eugenci/papermerge:2.0.0","container_name":"papermerge-app","restart":"unless-stopped","expose":[8000],"ports":["8888:8000"],"depends_on":["db","redis","worker"],"volumes":["\${DOCKER_VOLUME_STORAGE:-/mnt/docker-volumes}/papermerge/media_root:/opt/media"],"environment":["DJANGO_SETTINGS_MODULE=config.settings.production","POSTGRES_USER=dbuser","POSTGRES_PASSWORD=dbpass","POSTGRES_DB=dbname","POSTGRES_HOST=db","POSTGRES_PORT=5432"],"networks":["proxy"]},"db":{"image":"postgres:16-alpine","container_name":"papermerge-db","restart":"unless-stopped","expose":[5432],"volumes":["\${DOCKER_VOLUME_STORAGE:-/mnt/docker-volumes}/papermerge/psql-data:/var/lib/postgresql/data/"],"environment":["POSTGRES_USER=dbuser","POSTGRES_PASSWORD=dbpass","POSTGRES_DB=dbname"],"networks":["proxy"]},"redis":{"image":"redis:6-alpine","container_name":"papermerge-redis","restart":"unless-stopped","expose":[6379],"volumes":["\${DOCKER_VOLUME_STORAGE:-/mnt/docker-volumes}/papermerge/redis-data:/data"],"networks":["proxy"]},"worker":{"image":"eugenci/papermerge-worker:v2.0.0","container_name":"papermerge-worker","restart":"unless-stopped","volumes":["\${DOCKER_VOLUME_STORAGE:-/mnt/docker-volumes}/papermerge/media_root:/opt/media"],"environment":["DJANGO_SETTINGS_MODULE=config.settings.production","POSTGRES_USER=dbuser","POSTGRES_PASSWORD=dbpass","POSTGRES_DB=dbname","POSTGRES_HOST=db","POSTGRES_PORT=5432"],"networks":["proxy"]}},"networks":{"proxy":{"external":true}}}`
        const result = Translator.fromDict(JSON.parse(specialInput))
        expect(result).toBeDefined()
    })

    //{"services":{"udp-service":{"image":"alpine","ports":["5000:5000/udp"]}}}

    test("port UDP only",()=>{
        const specialInput = `{"services":{"udp-service":{"image":"alpine","ports":["5001:5000/udp"]}}}`
        const result = Translator.fromDict(JSON.parse(specialInput))
        expect(result).toBeDefined()
        expect((Array.from(result.services)[0] as Service).name).toBe("udp-service")
        const port = (Array.from(result.services)[0] as Service)?.ports?.[0]
        expect(port).toBeDefined()
        expect(port?.containerPort).toBe(5000)
        expect(port?.hostPort).toBe(5001)
        expect(port?.protocol).toBe(Protocol.UDP)
    })

    test("supabase docker compose",()=>{
        const yamlFilePath = path.join(__dirname, 'supabase.yaml');
        const yamlData = YAML.parse(fs.readFileSync(yamlFilePath, 'utf8'));
        const result = Translator.fromDict(yamlData)
        expect(result).toBeDefined()
    })

    test("label read",()=>{
        const specialInput = `{"version":"3.8","services":{"web":{"image":"nginx:latest","container_name":"web_container","labels":["com.example.service=web","com.example.version=1.0","com.example.department=frontend"],"ports":["8080:80"],"networks":["webnet"]},"db":{"image":"postgres:latest","container_name":"db_container","labels":["com.example.service=db","com.example.version=13.3","com.example.department=backend"],"environment":{"POSTGRES_USER":"user","POSTGRES_PASSWORD":"password","POSTGRES_DB":"mydb"},"volumes":["db_data:/var/lib/postgresql/data"],"networks":["webnet"]}},"networks":{"webnet":{"driver":"bridge"}},"volumes":{"db_data":{"driver":"local"}}}`
        const result = Translator.fromDict(JSON.parse(specialInput))
        expect(result).toBeDefined()
        const serviceWebLabels = result.services.get("name","web")?.labels
        expect(serviceWebLabels).toBeDefined()
        if(serviceWebLabels){
            expect(serviceWebLabels?.length).toBe(3)
        }
    })

    test("label read labels object",()=>{
        const specialInput = `{"version":"3.8","services":{"web":{"image":"nginx:latest","container_name":"web_container","labels":{"com.example.service":"web","com.example.version":"1.0","com.example.department":"frontend"},"ports":["8080:80"],"networks":["webnet"]},"db":{"image":"postgres:latest","container_name":"db_container","labels":{"com.example.service":"db","com.example.version":"13.3","com.example.department":"backend"},"environment":{"POSTGRES_USER":"user","POSTGRES_PASSWORD":"password","POSTGRES_DB":"mydb"},"volumes":["db_data:/var/lib/postgresql/data"],"networks":["webnet"]}},"networks":{"webnet":{"driver":"bridge"}},"volumes":{"db_data":{"driver":"local"}}}`
        const result = Translator.fromDict(JSON.parse(specialInput))
        expect(result).toBeDefined()
        const serviceWebLabels = result.services.get("name","web")?.labels
        expect(serviceWebLabels).toBeDefined()
        if(serviceWebLabels){
            expect(serviceWebLabels?.length).toBe(3)
        }
    })

    test("fix issue #3",()=>{
        const specialInput = `{"networks":{"default":{"name":"rxresume-network"},"tk-proxy":{"name":"tk-proxy","external":true}},"services":{"postgres":{"container_name":"rxresume-postgres","env_file":[".env"],"environment":{"POSTGRES_DB":"postgres","POSTGRES_PASSWORD":"\${DB_PASSWORD}","POSTGRES_USER":"postgres"},"healthcheck":{"test":["CMD-SHELL","pg_isready -U postgres -d postgres"],"interval":"10s","timeout":"5s","retries":5},"image":"postgres:16-alpine","restart":"unless-stopped","volumes":[{"type":"bind","source":"./container_data/postgres/data","target":"/var/lib/postgresql/data","read_only":false}]},"minio":{"command":"server --address \\":9000\\" --console-address \\":9001\\" /data","container_name":"rxresume-minio","env_file":[".env"],"environment":{"MINIO_ROOT_PASSWORD":"\${STORAGE_PASSWORD}","MINIO_ROOT_USER":"minioadmin"},"image":"minio/minio","labels":{"traefik.enable":true,"traefik.http.routers.rxresume-storage.entrypoints":"https","traefik.http.routers.rxresume-storage.rule":"Host(\`rxresume-storage.cf.domain.tld\`)","traefik.http.routers.rxresume-storage.service":"rxresume-storage","traefik.http.routers.rxresume-storage.tls":true,"traefik.http.services.rxresume-storage.loadbalancer.server.port":9000},"networks":["default","tk-proxy"],"restart":"unless-stopped","volumes":[{"type":"bind","source":"./container_data/minio/data","target":"/data","read_only":false}]},"chrome":{"container_name":"rxresume-chrome","environment":{"CONCURRENT":10,"EXIT_ON_HEALTH_FAILURE":true,"PRE_REQUEST_HEALTH_CHECK":true,"TIMEOUT":60000,"TOKEN":"\${CHROME_TOKEN}"},"extra_hosts":["host.docker.internal:host-gateway"],"image":"ghcr.io/browserless/chromium:v2.18.0","restart":"unless-stopped"},"rxresume":{"container_name":"rxresume","depends_on":["postgres","minio","chrome"],"environment":{"ACCESS_TOKEN_SECRET":"\${ACCESS_TOKEN_SECRET}","CHROME_TOKEN":"\${CHROME_TOKEN}","CHROME_URL":"ws://rxresume-chrome:3000","DATABASE_URL":"postgresql://postgres:\${DB_PASSWORD}@rxresume-postgres:5432/postgres","NODE_ENV":"production","PORT":3005,"PUBLIC_URL":"https://rxresume.cf.domain.tld","REFRESH_TOKEN_SECRET":"\${REFRESH_TOKEN_SECRET}","STORAGE_ACCESS_KEY":"minioadmin","STORAGE_BUCKET":"default","STORAGE_ENDPOINT":"rxresume-minio","STORAGE_PORT":9000,"STORAGE_REGION":"us-east-1","STORAGE_SECRET_KEY":"\${STORAGE_PASSWORD}","STORAGE_SKIP_BUCKET_CHECK":false,"STORAGE_URL":"https://rxresume-storage.cf.domain.tld/default","STORAGE_USE_SSL":false},"image":"amruthpillai/reactive-resume:latest","labels":{"traefik.enable":true,"traefik.http.routers.rxresume.entrypoints":"https","traefik.http.routers.rxresume.rule":"Host(\`rxresume.cf.domain.tld\`)","traefik.http.routers.rxresume.service":"rxresume","traefik.http.routers.rxresume.tls":true,"traefik.http.services.rxresume.loadbalancer.server.port":3005},"networks":["default","tk-proxy"],"restart":"unless-stopped"}}}`
        const result = Translator.fromDict(JSON.parse(specialInput))
        expect(result).toBeDefined()
        const minio = result.services.get("name","minio")
        expect(minio).toBeDefined()
        if(minio){
            expect(minio.bindings.size===1).toBeTruthy()
        }
    })
});
