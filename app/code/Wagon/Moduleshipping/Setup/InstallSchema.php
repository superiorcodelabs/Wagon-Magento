<?php 
namespace Wagon\Moduleshipping\Setup;
use Magento\Framework\Setup\SchemaSetupInterface;
use Magento\Framework\Setup\ModuleContextInterface;
use Magento\Framework\DB\Ddl\Table;
class InstallSchema implements \Magento\Framework\Setup\InstallSchemaInterface{
    public function install(SchemaSetupInterface $setup,ModuleContextInterface $context){
        $setup->startSetup();
        $conn = $setup->getConnection();
        $tableName = $setup->getTable('wagon_shipment');
        if($conn->isTableExists($tableName) != true){
            $table = $conn->newTable($tableName)
                            ->addColumn(
                                'id',
                                Table::TYPE_INTEGER,
                                null,
                                ['identity'=>true,'unsigned'=>true,'nullable'=>false,'primary'=>true]
                                )
                            ->addColumn(
                                'title',
                                Table::TYPE_TEXT,
                                255,
                                ['nullable'=>false,'default'=>'']
                                )
                            ->addColumn(
                                'content',
                                Table::TYPE_TEXT,
                                '2M',
                                ['nullbale'=>false,'default'=>'']
                                )
                            ->addColumn(
                                'status',
                                Table::TYPE_INTEGER,
                                '11',
                                ['nullbale'=>false,'default'=>'0']
                                )    
                            ->addColumn(
                                'order_id',
                                Table::TYPE_INTEGER,
                                11,
                                ['nullbale'=>false]
                                )
                            ->addColumn(
                                'shipment_id',
                                Table::TYPE_INTEGER,
                                11,
                                ['nullbale'=>false]
                                )    
                            ->addColumn(
                                'added_date',
                                Table::TYPE_TIMESTAMP,
                                null,
                                [
                                    'nullable' => false,
                                    'default' => Table::TIMESTAMP_INIT,
                                ],
                                'Added Date'
                                )     
                            ->setOption('charset','utf8');
            $conn->createTable($table);
        }
        $setup->endSetup();
    }
}
 ?>