async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const MemeFactory = await ethers.getContractFactory("MemeFactory");
  const factory = await MemeFactory.deploy();
  await factory.deployed();

  console.log("MemeFactory deployed to:", factory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
