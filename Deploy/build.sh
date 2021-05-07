echo Starting build on Azure 
SRC_DIR=$GITHUB_WORKSPACE
version=`cat $SRC_DIR/version.txt`
DOCKER_USERNAME=$DOCKER_USER # YOU NEED TO ADD TO THE GH SECRETS
DOCKER_PASSWORD=$DOCKER_PASS # YOU NEED TO ADD TO THE GH SECRETS

echo $version
USERNAME=agahkarakuzu
IMAGE=sunrise

# Build docker image
cd $SRC_DIR/Deploy
docker build -t $USERNAME/$IMAGE:$version -t $USERNAME/$IMAGE:latest --build-arg TAG=$version .

# PUSH
echo $DOCKER_PASSWORD | docker login --username $DOCKER_USERNAME --password-stdin
docker push $USERNAME/$IMAGE:latest
docker push $USERNAME/$IMAGE:$version
docker logout
